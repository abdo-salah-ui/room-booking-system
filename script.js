let remainingPeople = 66;
const rooms = document.querySelectorAll('.room');
const modal = document.getElementById('bookingModal');
const adminModal = document.getElementById('adminModal');
const closeBtn = document.querySelector('.close');
const adminCloseBtn = document.querySelector('.admin-close');
let currentRoom = null;
let reservations = new Map(); // Store name -> bed element mapping
let isAdminMode = false;

// Admin functionality
const ADMIN_PASSWORD = '01093396185';

// Load data from localStorage on page load
function loadFromLocalStorage() {
    const savedReservations = localStorage.getItem('reservations');
    const savedRemainingPeople = localStorage.getItem('remainingPeople');
    
    if (savedRemainingPeople) {
        remainingPeople = parseInt(savedRemainingPeople);
        document.getElementById('remainingPeople').textContent = remainingPeople;
    }
    
    if (savedReservations) {
        const reservationData = JSON.parse(savedReservations);
        
        reservationData.forEach(reservation => {
            const { name, roomIndex, bedIndex } = reservation;
            const room = rooms[roomIndex];
            const bed = room.querySelectorAll('.bed')[bedIndex];
            
            if (bed) {
                bed.classList.add('occupied');
                bed.setAttribute('data-name', name);
                reservations.set(name, bed);
                
                // Check if room is full and disable booking button
                const bedCount = parseInt(room.dataset.beds);
                const occupiedBeds = room.querySelectorAll('.bed.occupied').length;
                if(occupiedBeds === bedCount) {
                    room.querySelector('.book-btn').disabled = true;
                }
            }
        });
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    const reservationData = [];
    reservations.forEach((bed, name) => {
        // Find room and bed indices
        const room = bed.closest('.room');
        const roomIndex = Array.from(rooms).indexOf(room);
        const beds = room.querySelectorAll('.bed');
        const bedIndex = Array.from(beds).indexOf(bed);
        
        reservationData.push({
            name,
            roomIndex,
            bedIndex
        });
    });
    
    localStorage.setItem('reservations', JSON.stringify(reservationData));
    localStorage.setItem('remainingPeople', remainingPeople.toString());
}

document.getElementById('adminLogin').addEventListener('click', () => {
    adminModal.style.display = 'block';
});

document.getElementById('confirmAdminLogin').addEventListener('click', () => {
    const password = document.getElementById('adminPassword').value;
    const adminError = document.getElementById('adminError');
    
    if (password === ADMIN_PASSWORD) {
        isAdminMode = true;
        adminModal.style.display = 'none';
        document.getElementById('adminStatus').textContent = 'وضع المسؤول نشط';
        document.getElementById('adminPassword').value = '';
        adminError.style.display = 'none';
    } else {
        adminError.textContent = 'كلمة المرور غير صحيحة';
        adminError.style.display = 'block';
    }
});

// Initialize rooms
rooms.forEach(room => {
    const bedCount = parseInt(room.dataset.beds);
    const bedsContainer = room.querySelector('.beds');
    
    // Create bed elements
    for(let i = 0; i < bedCount; i++) {
        const bed = document.createElement('div');
        bed.className = 'bed';
        bed.addEventListener('click', function() {
            if (this.classList.contains('occupied')) {
                const personName = this.getAttribute('data-name');
                if (isAdminMode || reservations.get(personName) === this) {
                    if (confirm(`هل تريد إلغاء حجز ${personName}?`)) {
                        this.classList.remove('occupied');
                        this.removeAttribute('data-name');
                        remainingPeople++;
                        document.getElementById('remainingPeople').textContent = remainingPeople;
                        reservations.delete(personName);
                        const roomBookBtn = room.querySelector('.book-btn');
                        roomBookBtn.disabled = false;
                        saveToLocalStorage(); // Save after cancellation
                    }
                } else {
                    alert('عذراً، لا يمكنك إلغاء حجز شخص آخر');
                }
            }
        });
        bedsContainer.appendChild(bed);
    }
    
    // Add booking button click handler
    const bookBtn = room.querySelector('.book-btn');
    bookBtn.addEventListener('click', () => openBookingModal(room));
});

function openBookingModal(room) {
    if (!room) return;
    
    currentRoom = room;
    const roomNumber = room.querySelector('h3').textContent.replace('غرفة ', '');
    const occupiedBeds = room.querySelectorAll('.bed.occupied').length;
    const bedCount = parseInt(room.dataset.beds);
    
    if(occupiedBeds === bedCount) {
        alert('عذراً، هذه الغرفة ممتلئة');
        return;
    }
    
    const roomNumberSpan = document.getElementById('roomNumber');
    if (roomNumberSpan) {
        roomNumberSpan.textContent = roomNumber;
    }
    
    // Reset name input and error message
    const nameInput = document.querySelector('.name-input');
    const errorMessage = document.getElementById('errorMessage');
    if (nameInput) {
        nameInput.value = '';
    }
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    
    modal.style.display = 'block';
}

// Close modal handlers
closeBtn.onclick = () => {
    modal.style.display = 'none';
};

adminCloseBtn.onclick = () => {
    adminModal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    } else if (event.target === adminModal) {
        adminModal.style.display = 'none';
    }
};

document.getElementById('confirmBooking').addEventListener('click', () => {
    const nameInput = document.querySelector('.name-input');
    const name = nameInput.value.trim();
    const errorMessage = document.getElementById('errorMessage');
    
    if(!name) {
        errorMessage.textContent = 'من فضلك أدخل اسمك';
        errorMessage.style.display = 'block';
        return;
    }
    
    // Check if person already has a reservation
    if(reservations.has(name)) {
        errorMessage.textContent = 'عذراً، لديك حجز بالفعل. إذا كنت ترغب في تغيير حجزك، يجب عليك إلغاء حجزك السابق أولاً';
        errorMessage.style.display = 'block';
        return;
    }
    
    if (!currentRoom) {
        alert('حدث خطأ. يرجى المحاولة مرة أخرى');
        modal.style.display = 'none';
        return;
    }
    
    // Find first available bed in current room
    const firstAvailableBed = currentRoom.querySelector('.bed:not(.occupied)');
    
    if (!firstAvailableBed) {
        alert('عذراً، هذه الغرفة ممتلئة');
        modal.style.display = 'none';
        return;
    }
    
    // Update remaining people count
    remainingPeople--;
    document.getElementById('remainingPeople').textContent = remainingPeople;
    
    // Update bed status
    firstAvailableBed.classList.add('occupied');
    firstAvailableBed.setAttribute('data-name', name);
    
    // Add to reservations
    reservations.set(name, firstAvailableBed);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // Check if room is full
    const bedCount = parseInt(currentRoom.dataset.beds);
    const occupiedBeds = currentRoom.querySelectorAll('.bed.occupied').length;
    if(occupiedBeds === bedCount) {
        currentRoom.querySelector('.book-btn').disabled = true;
    }
    
    // Close modal
    modal.style.display = 'none';
});

// Load saved data when page loads
window.addEventListener('load', loadFromLocalStorage);
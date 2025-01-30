// Firebase Configuration and Initialization
const firebaseConfig = {
  apiKey: "AIzaSyA4uJaRBwSw0l0tFqx8-cP2Yki-VQWpssw",
  authDomain: "siwa-64418.firebaseapp.com",
  databaseURL: "https://siwa-64418-default-rtdb.firebaseio.com",
  projectId: "siwa-64418",
  storageBucket: "siwa-64418.firebasestorage.app",
  messagingSenderId: "290337248229",
  appId: "1:290337248229:web:5e4bdb01a119499246150c",
  measurementId: "G-XQ25F2K04Y"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variables
let remainingPeople = 66;
const rooms = document.querySelectorAll('.room');
const modal = document.getElementById('bookingModal');
const adminModal = document.getElementById('adminModal');
const closeBtn = document.querySelector('.close');
const adminCloseBtn = document.querySelector('.admin-close');
let currentRoom = null;
let isAdminMode = false;

// Admin functionality
const ADMIN_PASSWORD = '01093396185';

// Load data from Firebase on page load
function loadFromFirebase() {
  database.ref("reservations").on("value", (snapshot) => {
    const data = snapshot.val();
    if (data) {
      updateRoomsFromData(data);
    }
  });
}

function updateRoomsFromData(data) {
  Object.keys(data).forEach((roomId) => {
    const roomData = data[roomId];
    const roomElement = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomElement) {
      roomElement.querySelectorAll('.bed').forEach((bed, index) => {
        if (roomData[index] && roomData[index].occupied) {
          bed.classList.add('occupied');
          bed.setAttribute('data-name', roomData[index].name);
        } else {
          bed.classList.remove('occupied');
          bed.removeAttribute('data-name');
        }
      });
    }
  });
}

// Save reservation to Firebase
function saveReservationToFirebase(roomId, bedIndex, name) {
  database.ref(`reservations/${roomId}/${bedIndex}`).set({
    occupied: true,
    name: name
  });
}

// Remove reservation from Firebase
function removeReservationFromFirebase(roomId, bedIndex) {
  database.ref(`reservations/${roomId}/${bedIndex}`).set(null);
}

// Initialize rooms
rooms.forEach((room, roomIndex) => {
  const bedCount = parseInt(room.dataset.beds);
  const bedsContainer = room.querySelector('.beds');
  const roomId = `room-${roomIndex}`;
  room.setAttribute('data-room-id', roomId);

  // Create bed elements
  for (let i = 0; i < bedCount; i++) {
    const bed = document.createElement('div');
    bed.className = 'bed';
    bed.addEventListener('click', function () {
      if (this.classList.contains('occupied')) {
        const personName = this.getAttribute('data-name');
        if (isAdminMode) {
          if (confirm(`هل تريد إلغاء حجز ${personName}?`)) {
            this.classList.remove('occupied');
            this.removeAttribute('data-name');
            removeReservationFromFirebase(roomId, i);
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
  bookBtn.addEventListener('click', () => openBookingModal(roomId, room));
});

function openBookingModal(roomId, room) {
  if (!room) return;

  currentRoom = { roomId, room };
  const roomNumber = room.querySelector('h3').textContent.replace('غرفة ', '');
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

  if (!name) {
    errorMessage.textContent = 'من فضلك أدخل اسمك';
    errorMessage.style.display = 'block';
    return;
  }

  if (!currentRoom) {
    alert('حدث خطأ. يرجى المحاولة مرة أخرى');
    modal.style.display = 'none';
    return;
  }

  const roomId = currentRoom.roomId;
  const room = currentRoom.room;
  const firstAvailableBed = room.querySelector('.bed:not(.occupied)');

  if (!firstAvailableBed) {
    alert('عذراً، هذه الغرفة ممتلئة');
    modal.style.display = 'none';
    return;
  }

  const bedIndex = Array.from(room.querySelectorAll('.bed')).indexOf(firstAvailableBed);

  // Update bed status
  firstAvailableBed.classList.add('occupied');
  firstAvailableBed.setAttribute('data-name', name);

  // Save to Firebase
  saveReservationToFirebase(roomId, bedIndex, name);

  modal.style.display = 'none';
});

// Load data from Firebase
window.addEventListener('load', loadFromFirebase);

let books = [];
let editIndex = null;

const form = document.getElementById('book-form');
const cancelEditBtn = document.getElementById('cancel-edit');

async function loadBooks() {
  try {
    const response = await fetch('http://localhost:3000/books');
    books = await response.json();
    displayBooks();
  } catch (error) {
    console.error('Erreur de chargement des livres :', error);
    books = [];
  }
}

async function saveBooks() {
  try {
    await fetch('http://localhost:3000/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(books)
    });
  } catch (error) {
    console.error('Erreur de sauvegarde des livres :', error);
  }
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const updatedBook = {
    title: document.getElementById('title').value,
    author: document.getElementById('author').value,
    edition: document.getElementById('edition').value,
    editionDate: document.getElementById('editionDate').value,
    readingDate: document.getElementById('readingDate').value,
    comment: document.getElementById('comment').value,
    note: parseFloat(document.getElementById('note').value),
    cover: ''
  };

  const file = document.getElementById('cover').files[0];

  const saveBook = async () => {
    if (editIndex !== null) {
      updatedBook.cover = updatedBook.cover || books[editIndex].cover;
      books[editIndex] = updatedBook;
      editIndex = null;
      form.querySelector('button[type="submit"]').textContent = "Ajouter le livre";
      form.classList.remove('editing');
      cancelEditBtn.style.display = 'none';
    } else {
      books.push(updatedBook);
    }
    await saveBooks();
    displayBooks();
    form.reset();
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      updatedBook.cover = event.target.result;
      saveBook();
    };
    reader.readAsDataURL(file);
  } else {
    saveBook();
  }
});

cancelEditBtn.addEventListener('click', () => {
  form.reset();
  editIndex = null;
  form.querySelector('button[type="submit"]').textContent = "Ajouter le livre";
  form.classList.remove('editing');
  cancelEditBtn.style.display = 'none';
});

function displayBooks(filteredBooks = books) {
  const list = document.getElementById('book-list');
  list.innerHTML = '';

  filteredBooks.forEach((book, index) => {
    const card = document.createElement('div');
    card.className = 'book-card';

    card.innerHTML = `
      ${book.cover ? `<img src="${book.cover}" alt="Couverture">` : ''}
      <h3>${book.title}</h3>
      <p><strong>Auteur:</strong> ${book.author}</p>
      <p><strong>Édition:</strong> ${book.edition}</p>
      <p><strong>Date d'édition:</strong> ${book.editionDate}</p>
      <p><strong>Date de lecture:</strong> ${book.readingDate}</p>
      <p><strong>Commentaire:</strong> ${book.comment}</p>
      <p><strong>Note:</strong> ${book.note}/10</p>
      <button onclick="deleteBook(${index})">Supprimer</button>
      <button onclick="editBook(${index})">Modifier</button>
    `;
    list.appendChild(card);
  });
}

function deleteBook(index) {
  books.splice(index, 1);
  saveBooks();
  applyFilters();
}

function editBook(index) {
  const book = books[index];
  document.getElementById('title').value = book.title;
  document.getElementById('author').value = book.author;
  document.getElementById('edition').value = book.edition;
  document.getElementById('editionDate').value = book.editionDate;
  document.getElementById('readingDate').value = book.readingDate;
  document.getElementById('comment').value = book.comment;
  document.getElementById('note').value = book.note;

  editIndex = index;

  form.querySelector('button[type="submit"]').textContent = "Modifier le livre";
  form.classList.add('editing');
  cancelEditBtn.style.display = 'inline';
}

function sortBooks(criterion) {
  books.sort((a, b) => (a[criterion] > b[criterion]) ? 1 : -1);
  applyFilters();
}

function sortBooksByNote() {
  books.sort((a, b) => b.note - a.note);
  applyFilters();
}

function applyFilters() {
  const keyword = document.getElementById('search-input').value.toLowerCase();
  const selectedNote = document.getElementById('note-filter').value;

  const filteredBooks = books.filter(book => {
    const textMatch = (
      book.title + book.author + book.comment + book.edition
    ).toLowerCase().includes(keyword);

    const noteMatch = selectedNote === "" || book.note === parseFloat(selectedNote);
    return textMatch && noteMatch;
  });

  displayBooks(filteredBooks);
}

function exportBooks() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "mes_lectures_therapies.json");
  dlAnchorElem.click();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./service-worker.js').then(function (registration) {
      console.log('ServiceWorker enregistré avec succès:', registration.scope);
    }, function (error) {
      console.log('Erreur lors de l’enregistrement du ServiceWorker:', error);
    });
  });
}

loadBooks(); // Charger les livres au démarrage

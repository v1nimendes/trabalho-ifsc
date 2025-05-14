// DOM elements
const searchInput = document.getElementById('searchInput');
const contactsList = document.getElementById('contactsList');
const loadingRow = document.getElementById('loadingRow');
const noContactsRow = document.getElementById('noContactsRow');
const addContactBtn = document.getElementById('addContactBtn');
const contactModal = new bootstrap.Modal(document.getElementById('contactModal'));
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
const viewContactModal = new bootstrap.Modal(document.getElementById('viewContactModal'));
const contactForm = document.getElementById('contactForm');
const saveContactBtn = document.getElementById('saveContactBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const alertContainer = document.getElementById('alertContainer');
const editFromViewBtn = document.getElementById('editFromViewBtn');

// Current contact being edited or deleted
let currentContactId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load initial contacts
    loadContacts();

    // Event listeners
    searchInput.addEventListener('input', debounce(loadContacts, 300));
    addContactBtn.addEventListener('click', showAddContactModal);
    saveContactBtn.addEventListener('click', saveContact);
    confirmDeleteBtn.addEventListener('click', deleteContact);
    editFromViewBtn.addEventListener('click', function() {
        viewContactModal.hide();
        showEditContactModal(currentContactId);
    });
});

// Debounce function to limit how often a function can be called
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Load contacts from the API
async function loadContacts() {
    try {
        // Show loading state
        loadingRow.classList.remove('d-none');
        noContactsRow.classList.add('d-none');
        
        // Clear existing contacts (except loading and no contacts rows)
        const rows = contactsList.querySelectorAll('tr:not(#loadingRow):not(#noContactsRow)');
        rows.forEach(row => row.remove());
        
        // Get search term
        const searchTerm = searchInput.value.trim();
        
        // Fetch contacts from API
        const response = await fetch(`/api/contacts${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const contacts = await response.json();
        
        // Hide loading state
        loadingRow.classList.add('d-none');
        
        // Display contacts or no contacts message
        if (contacts.length === 0) {
            noContactsRow.classList.remove('d-none');
        } else {
            contacts.forEach(contact => {
                appendContactToTable(contact);
            });
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        showAlert('Failed to load contacts. Please try again.', 'danger');
        loadingRow.classList.add('d-none');
    }
}

// Append a contact to the contacts table
function appendContactToTable(contact) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', contact.id);
    
    row.innerHTML = `
        <td>${escapeHtml(contact.name)}</td>
        <td>${escapeHtml(contact.email || '')}</td>
        <td>${escapeHtml(contact.phone || '')}</td>
        <td>
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-sm btn-info view-btn" data-id="${contact.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-sm btn-primary edit-btn" data-id="${contact.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-sm btn-danger delete-btn" data-id="${contact.id}" data-name="${escapeHtml(contact.name)}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Add event listeners to the buttons
    row.querySelector('.view-btn').addEventListener('click', () => showViewContactModal(contact.id));
    row.querySelector('.edit-btn').addEventListener('click', () => showEditContactModal(contact.id));
    row.querySelector('.delete-btn').addEventListener('click', () => showDeleteModal(contact.id, contact.name));
    
    contactsList.appendChild(row);
}

// Show the add contact modal
function showAddContactModal() {
    // Reset form
    contactForm.reset();
    currentContactId = null;
    
    // Update modal title
    document.getElementById('contactModalLabel').textContent = 'Add Contact';
    
    // Show modal
    contactModal.show();
}

// Show the edit contact modal
async function showEditContactModal(contactId) {
    try {
        // Update modal title
        document.getElementById('contactModalLabel').textContent = 'Edit Contact';
        
        // Store current contact ID
        currentContactId = contactId;
        
        // Fetch contact details
        const response = await fetch(`/api/contacts/${contactId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const contact = await response.json();
        
        // Fill form with contact details
        document.getElementById('contactId').value = contact.id;
        document.getElementById('name').value = contact.name || '';
        document.getElementById('email').value = contact.email || '';
        document.getElementById('phone').value = contact.phone || '';
        document.getElementById('address').value = contact.address || '';
        document.getElementById('notes').value = contact.notes || '';
        
        // Show modal
        contactModal.show();
    } catch (error) {
        console.error('Error loading contact details:', error);
        showAlert('Failed to load contact details. Please try again.', 'danger');
    }
}

// Show the view contact modal
async function showViewContactModal(contactId) {
    try {
        // Store current contact ID
        currentContactId = contactId;
        
        // Fetch contact details
        const response = await fetch(`/api/contacts/${contactId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const contact = await response.json();
        
        // Fill modal with contact details
        document.getElementById('viewName').textContent = contact.name || 'No name provided';
        document.getElementById('viewEmail').textContent = contact.email || 'No email provided';
        document.getElementById('viewPhone').textContent = contact.phone || 'No phone provided';
        document.getElementById('viewAddress').textContent = contact.address || 'No address provided';
        document.getElementById('viewNotes').textContent = contact.notes || 'No notes provided';
        
        // Show modal
        viewContactModal.show();
    } catch (error) {
        console.error('Error loading contact details:', error);
        showAlert('Failed to load contact details. Please try again.', 'danger');
    }
}

// Show the delete confirmation modal
function showDeleteModal(contactId, contactName) {
    // Store current contact ID
    currentContactId = contactId;
    
    // Set contact name in modal
    document.getElementById('deleteContactName').textContent = contactName;
    
    // Show modal
    deleteModal.show();
}

// Save (create or update) a contact
async function saveContact() {
    try {
        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const notes = document.getElementById('notes').value.trim();
        
        // Validate required fields
        if (!name) {
            document.getElementById('name').classList.add('is-invalid');
            return;
        }
        
        // Reset validation
        document.getElementById('name').classList.remove('is-invalid');
        
        // Prepare contact data
        const contactData = {
            name,
            email,
            phone,
            address,
            notes
        };
        
        let url = '/api/contacts';
        let method = 'POST';
        
        // If editing a contact, use PUT method
        if (currentContactId) {
            url = `/api/contacts/${currentContactId}`;
            method = 'PUT';
        }
        
        // Send request to API
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        
        // Hide modal
        contactModal.hide();
        
        // Show success message
        showAlert(
            currentContactId ? 'Contact updated successfully!' : 'Contact added successfully!',
            'success'
        );
        
        // Reload contacts
        loadContacts();
    } catch (error) {
        console.error('Error saving contact:', error);
        showAlert(`Failed to save contact: ${error.message}`, 'danger');
    }
}

// Delete a contact
async function deleteContact() {
    try {
        if (!currentContactId) {
            throw new Error('No contact selected for deletion');
        }
        
        // Send delete request to API
        const response = await fetch(`/api/contacts/${currentContactId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        
        // Hide modal
        deleteModal.hide();
        
        // Show success message
        showAlert('Contact deleted successfully!', 'success');
        
        // Reload contacts
        loadContacts();
    } catch (error) {
        console.error('Error deleting contact:', error);
        showAlert(`Failed to delete contact: ${error.message}`, 'danger');
    }
}

// Show an alert message
function showAlert(message, type = 'info') {
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
    alertElement.setAttribute('role', 'alert');
    
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add alert to container
    alertContainer.appendChild(alertElement);
    
    // Automatically remove alert after 5 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => alertElement.remove(), 150);
    }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

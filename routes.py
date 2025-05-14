import logging
from flask import jsonify, request, render_template, flash, redirect, url_for
from sqlalchemy import or_
from app import app, db
from models import Contact

# API routes for CRUD operations

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    """API endpoint to get all contacts."""
    try:
        search_term = request.args.get('search', '')
        if search_term:
            # Search for contacts matching the search term
            contacts = Contact.query.filter(
                or_(
                    Contact.name.ilike(f'%{search_term}%'),
                    Contact.email.ilike(f'%{search_term}%'),
                    Contact.phone.ilike(f'%{search_term}%'),
                    Contact.address.ilike(f'%{search_term}%'),
                    Contact.notes.ilike(f'%{search_term}%')
                )
            ).all()
        else:
            # Get all contacts
            contacts = Contact.query.all()
        
        # Convert contacts to dictionaries
        contacts_list = [contact.to_dict() for contact in contacts]
        return jsonify(contacts_list)
    except Exception as e:
        logging.error(f"Error fetching contacts: {str(e)}")
        return jsonify({"error": "Failed to fetch contacts"}), 500

@app.route('/api/contacts/<int:contact_id>', methods=['GET'])
def get_contact(contact_id):
    """API endpoint to get a specific contact."""
    try:
        contact = Contact.query.get_or_404(contact_id)
        return jsonify(contact.to_dict())
    except Exception as e:
        logging.error(f"Error fetching contact {contact_id}: {str(e)}")
        return jsonify({"error": f"Failed to fetch contact {contact_id}"}), 500

@app.route('/api/contacts', methods=['POST'])
def create_contact():
    """API endpoint to create a new contact."""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({"error": "Name is required"}), 400
        
        # Create new contact
        new_contact = Contact(
            name=data.get('name'),
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            notes=data.get('notes', '')
        )
        
        db.session.add(new_contact)
        db.session.commit()
        
        return jsonify(new_contact.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error creating contact: {str(e)}")
        return jsonify({"error": "Failed to create contact"}), 500

@app.route('/api/contacts/<int:contact_id>', methods=['PUT'])
def update_contact(contact_id):
    """API endpoint to update a contact."""
    try:
        contact = Contact.query.get_or_404(contact_id)
        data = request.json
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({"error": "Name is required"}), 400
        
        # Update contact fields
        contact.name = data.get('name')
        contact.email = data.get('email', '')
        contact.phone = data.get('phone', '')
        contact.address = data.get('address', '')
        contact.notes = data.get('notes', '')
        
        db.session.commit()
        
        return jsonify(contact.to_dict())
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error updating contact {contact_id}: {str(e)}")
        return jsonify({"error": f"Failed to update contact {contact_id}"}), 500

@app.route('/api/contacts/<int:contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    """API endpoint to delete a contact."""
    try:
        contact = Contact.query.get_or_404(contact_id)
        db.session.delete(contact)
        db.session.commit()
        
        return jsonify({"message": f"Contact {contact_id} deleted successfully"})
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error deleting contact {contact_id}: {str(e)}")
        return jsonify({"error": f"Failed to delete contact {contact_id}"}), 500

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"error": "Internal server error"}), 500

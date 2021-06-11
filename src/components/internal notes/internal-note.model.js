var keystone = require('keystone'),
    Types = keystone.Field.Types;

// Create model. Additional options allow menu name to be used what auto-generating URLs
var InternalNotes = new keystone.List('Internal Note', {
    autokey: { path: 'key', from: 'slug', unique: true },
    defaultSort: '-date'
});

// Create fields
InternalNotes.add( 'Target', {
    target: { type: Types.Select, label: 'target', options: 'child, family, social worker', initial: true },
    child: { type: Types.Relationship, label: 'child', ref: 'Child', dependsOn: { target: 'child' }, initial: true },
    family: { type: Types.Relationship, label: 'family', ref: 'Family', dependsOn: { target: 'family' }, initial: true },
    socialWorker: { type: Types.Relationship, label: 'social worker', ref: 'Social Worker', dependsOn: { target: 'social worker' }, initial: true }

}, 'Note Details', {

    date: { type: Types.Date, label: 'note date', inputFormat: 'MM/DD/YYYY', format: 'MM/DD/YYYY', default: '', utc: true, initial: true, note: 'if no date is specified today\'s date will be used' },
    employee: { type: Types.Relationship, label: 'note creator', ref: 'Admin', required: false, noedit: true, initial: true, note: 'if no creator is selected a current user will be used' },
    note: { type: Types.Textarea, label: 'note', required: true, initial: true }

});

InternalNotes.schema.pre( 'save', function( next ) {
	'use strict';
	
	// if employee is empty add current user:
	if ( typeof this.employee === 'undefined' && this._req_user ) {
		this.employee = this._req_user;
	}
	
	if ( this.child && this.isNew && typeof this._disablePreSave === 'undefined' ) {
		const Child = keystone.list( 'Child' );
		const InternalNotes = keystone.list( 'Internal Note' );
		const currentInternalNote = this;
		
		// Add the note to all siblingsToBePlacedWith:
		Child.model.findOne( { _id: this.child } ).populate('siblingsToBePlacedWith').exec( function( err, child ) {
			if ( err ) {
				console.error( `Error while loading Child object`, err );
				next();
			}
			
			Promise.all(
				child.siblingsToBePlacedWith.filter( childSibling => childSibling._id !== currentInternalNote.child ).map( childSibling =>
					new Promise( ( resolve, reject ) => {
						// Create note copy:
						const newInternalNotes = new InternalNotes.model({
							target: currentInternalNote.target,
							child: childSibling._id,
							employee: currentInternalNote.employee,
							note: currentInternalNote.note,
                            date: currentInternalNote.date
						});
						
						// To disable an infinite loop:
						newInternalNotes._disablePreSave = true;
						
						// Save the note
						newInternalNotes.save( ( err, model ) => {
							if ( err ) {
								return reject( new Error( `error saving new internal note for sibling` ) );
							}
							resolve();
						});
					})					
				)
			).then( () => next() );
		});
	} else {
		next();
	}
});

// Define default columns in the admin interface and register the model
InternalNotes.defaultColumns = 'date|20%, note|70%';
InternalNotes.register();
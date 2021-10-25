const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		maxlength: 50,
		trim: true
	},
	email: {
		type: String,
		required: true,
		trim: true
	},
	password: {
		type: String,
		minlength: 8,
		default: null
	},
	googleId: {
		type: String,
	},
	role: {
		type: String,
		enum: ['user', 'moderator', 'admin'],
		default: 'user'
	},
	active: {
		type: Boolean,
		default: false
	}
});

module.exports = mongoose.model('Users', UserSchema);

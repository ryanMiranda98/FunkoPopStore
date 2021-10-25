const config = require('config');
const mongoose = require('mongoose');

const app = require('./src/app');

const PORT = config.get('port');
const dbConfig = config.get('database');

mongoose.connect(dbConfig.url, {}, () => {
	console.log(`Connected to ${dbConfig.name} DB`);

	app.listen(PORT, () => {
		console.log(`Funko server is running on port ${PORT}`);
	});
});

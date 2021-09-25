const config = require("config");
const app = require("./src/app");

const PORT = config.get("port");

app.listen(PORT, () => {
  console.log(`Funko server is running on port ${PORT}`);
});

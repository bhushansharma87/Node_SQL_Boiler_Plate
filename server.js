const app = require("./app");
require("./config/database"); // Database Connection
// const { setupSocket } = require("./utils/setupSocket");
const { colorizeText } = require("./utils/others");
const server = require("http").createServer(app);
// setupSocket(server);
const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(colorizeText("Server Running on Port " + PORT, "green"));
});

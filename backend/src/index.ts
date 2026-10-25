import app from "./app";
import { connectPostgres } from "./config/dataSource";
import { initialService } from "./services/initial/initial.service";

const port = process.env.PORT || 8002;

const main = async () => {
  try {
    const dataSource = await connectPostgres();

    if (dataSource) {
      await initialService();
      console.log("Scheduler initialized");
    } else {
      console.warn(
        "Database unavailable. Starting HTTP server without database initialization.",
      );
    }

    app.listen(port, () => {
      console.log("HTTP Server is running on port", port);
    });
  } catch (err) {
    console.error("Error initializing application:", err);
    console.error(
      "HTTP server was not started because application initialization failed.",
    );
  }
};

main();

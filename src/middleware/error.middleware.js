export default function errorHandler(err, req, res, next) {
  console.log("Middlerware handling error");
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Internal Server Error";
  res.status(errorStatus).json({
    status: errorStatus,
    message: errorMessage,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}

// Forward asynchronous controller errors to the shared Express error handler.
export default function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

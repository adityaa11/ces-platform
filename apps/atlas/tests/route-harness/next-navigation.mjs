export function redirect(location) {
  const error = new Error(`redirect:${location}`);
  error.routeAction = "redirect";
  error.location = location;
  throw error;
}

export function forbidden() {
  const error = new Error("forbidden");
  error.routeAction = "forbidden";
  throw error;
}

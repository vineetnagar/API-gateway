const routes = [
  {
    path: "/users",
    targets: ["http://127.0.0.1:3001", "http://127.0.0.1:3011"],
    rewriteTo: "/user/getUsers",
  },
  {
    path: "/orders",
    targets: ["http://127.0.0.1:3002", "http://127.0.0.1:3012"],
    rewriteTo: "/orders/getOrders",
  },
];

export default routes;

const routes = [
  {
    path: "/users",
    target: "http://localhost:3001",
    rewriteTo: "/user/getUsers",
  },
  {
    path: "/orders",
    target: "http://localhost:3002",
    rewriteTo: "/orders/getOrders",
  },
];

export default routes;

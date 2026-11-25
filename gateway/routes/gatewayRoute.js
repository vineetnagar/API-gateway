const routes = [
  {
    path: "/users",
    target: "http://127.0.0.1:3001",
    rewriteTo: "/user/getUser",
  },
  {
    path: "/orders",
    target: "http://127.0.0.1:3002",
    rewriteTo: "/orders/getOrders",
  },
];

export default routes;

export function createRouter() {
  const routes = [];
  return {
    add(method, pattern, handler) {
      routes.push({ method, ...compilePattern(pattern), handler });
    },
    async handle(req, res, context) {
      for (const route of routes) {
        if (req.method !== route.method) continue;
        const match = context.pathname.match(route.regex);
        if (!match) continue;
        const params = {};
        route.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1]);
        });
        await route.handler(req, res, { ...context, params });
        return true;
      }
      return false;
    },
  };
}

function compilePattern(pattern) {
  const keys = [];
  const source = pattern
    .split("/")
    .map((part) => {
      if (part.startsWith(":")) {
        keys.push(part.slice(1));
        return "([^/]+)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return { regex: new RegExp(`^${source}$`), keys };
}

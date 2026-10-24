// Vercel Serverless Function entry point
// Wraps Express app for Vercel's serverless runtime

let appPromise = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { default: app } = await import('../backend/src/app.js');
      return app;
    })();
  }
  return appPromise;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('Unhandled Vercel serverless error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: false,
        error: {
          code: 'SERVERLESS_ERROR',
          message: error.message || 'Serverless invocation error',
        },
      })
    );
  }
}

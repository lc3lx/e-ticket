const port = process.env.port || 5000;
const serverPath = process.env.NODE_ENV === 'test' ? `http://127.0.0.1:${port}` : `http://e-ticketsapp.com.sy:${port}`;

export default serverPath;

import cors from 'cors';

export const originHandler = cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
  methods: 'GET,POST,PUT,DELETE,PATCH',
  credentials: true,
});

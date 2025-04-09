# ExamGen AI: Smart Syllabus-to-Exam Platform

ExamGen AI is an intelligent application that transforms educational syllabi into customized assessment experiences. Upload your syllabus documents and let AI generate tailored exams that you can take directly in the application.

![Exam Generation Platform](https://example.com/screenshot-placeholder.png)

## Features

- **Syllabus Upload**: Support for various document formats including PDF, DOCX, and TXT
- **AI-Powered Exam Generation**: Automatically extract key topics and create meaningful assessments
- **Customizable Exams**: Choose exam type, difficulty level, question count, and time limits
- **Interactive Exam Taking**: Take generated exams directly in the application
- **Results Tracking**: View detailed results after completing exams
- **Persistent Storage**: All syllabi and exams are stored in a PostgreSQL database for future access

## Technology Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js server with Node.js
- **Database**: PostgreSQL for data persistence
- **AI Models**: Google Gemini AI for content analysis and exam generation
- **Authentication**: Local authentication system
- **Storage**: File storage for uploaded syllabi

## Prerequisites

Before running this application, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL database

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database connection string
DATABASE_URL=postgresql://username:password@localhost:5432/examgen

# Google Gemini AI API key (required for AI features)
GOOGLE_API_KEY=your_google_api_key

# Optional OpenAI API key (fallback if Gemini is unavailable)
OPENAI_API_KEY=your_openai_api_key
```

## Installation and Setup

### Setting up in VS Code

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/examgen-ai.git
   cd examgen-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   Run the following command to create and configure the database schema:

   ```bash
   npm run db:push
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   This will start the Express backend server and the Vite frontend development server concurrently.

5. **Access the application**

   Open your browser and navigate to:
   
   ```
   http://localhost:3000
   ```

## Development Workflow

### VS Code Extensions

For the best development experience, install these recommended VS Code extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- REST Client

### Common Development Tasks

- **Running in development mode**:
  ```bash
  npm run dev
  ```

- **Building for production**:
  ```bash
  npm run build
  ```

- **Starting production server**:
  ```bash
  npm start
  ```

- **Database migration**:
  ```bash
  npm run db:push
  ```

## Project Structure

```
examgen-ai/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Application pages
│   │   └── App.tsx         # Main application component
├── server/                 # Backend Express application
│   ├── db.ts               # Database connection
│   ├── gemini.ts           # Google Gemini AI integration
│   ├── index.ts            # Server entry point
│   ├── openai.ts           # OpenAI integration (fallback)
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data storage interface
│   └── vite.ts             # Vite server integration
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Database schema and types
├── uploads/                # Directory for uploaded files
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Project dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## API Routes

The application exposes the following API endpoints:

- `POST /api/syllabuses`: Upload a new syllabus
- `GET /api/syllabuses`: Get all syllabuses
- `GET /api/syllabuses/:id`: Get a specific syllabus
- `DELETE /api/syllabuses/:id`: Delete a syllabus
- `POST /api/syllabuses/:id/exams`: Generate an exam for a syllabus
- `GET /api/syllabuses/:id/exams`: Get all exams for a syllabus
- `GET /api/exams/:id`: Get a specific exam with questions
- `POST /api/exams/:id/attempts`: Start an exam attempt
- `POST /api/attempts/:id/answers`: Submit answers for an attempt

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Ensure PostgreSQL is running
   - Check that your DATABASE_URL is correctly formatted
   - Verify database user has necessary permissions

2. **AI Generation Not Working**:
   - Verify your GOOGLE_API_KEY is valid and has necessary permissions
   - Check network connectivity to the Google API endpoints
   - The system will fall back to mock data if API keys are unavailable

3. **File Upload Problems**:
   - Ensure the 'uploads' directory exists and has write permissions
   - Check that your file is in a supported format

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Google Generative AI](https://ai.google.dev/)
# AudioHuzz - Music Identification Application

## Overview

AudioHuzz is a full-stack music identification application that allows users to upload audio files and receive detailed song information including artist, album, streaming links, and more. The application uses external music recognition APIs to analyze audio files and provides a modern web interface for user interaction.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, modern UI design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Comprehensive component system using Radix UI primitives with custom styling
- **Theme**: Dark mode design with custom color palette focused on music/audio aesthetics

### Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **File Handling**: Multer middleware for audio file uploads with size limits (10MB) and file type validation
- **API Structure**: RESTful endpoints for music identification and history retrieval
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Development**: Hot reloading with Vite integration for seamless development experience

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: Two main entities - songs and identifications with relational structure
- **Development Storage**: In-memory storage implementation for development/testing purposes
- **Connection**: Neon serverless PostgreSQL for production deployment

### Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Management**: Basic session handling setup present but not actively used
- **Future Consideration**: Application is structured to easily add authentication layers

### Database Schema Design
- **Songs Table**: Stores comprehensive song metadata including title, artist, album, year, genre, duration, and streaming platform URLs
- **Identifications Table**: Tracks user identification requests with confidence scores and file information
- **Relationships**: Foreign key relationship between identifications and songs
- **Timestamps**: Automatic timestamp tracking for both entities

## External Dependencies

### Music Recognition Service
- **Primary API**: AudD.io music identification service for audio fingerprinting and song recognition
- **Configuration**: API key-based authentication via environment variables
- **File Processing**: Supports various audio formats with automatic format conversion
- **Response Data**: Rich metadata including streaming links, album art, and detailed song information

### Database Service
- **Provider**: Neon Database (serverless PostgreSQL)
- **Connection**: Environment-based configuration with DATABASE_URL
- **Migration**: Drizzle Kit for database schema management and migrations

### UI Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **shadcn/ui**: Pre-styled component system built on top of Radix UI
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework for responsive design

### Development Tools
- **Replit Integration**: Custom plugins for development environment integration
- **Build Tools**: Vite for frontend bundling, esbuild for server bundling
- **Type Safety**: Full TypeScript implementation across frontend, backend, and shared schemas
- **Code Quality**: ESLint and TypeScript strict mode for code quality enforcement

### File Upload and Processing
- **Storage**: Temporary local file storage during processing
- **Validation**: MIME type checking and file size limits
- **Processing**: Audio file conversion and preprocessing for API submission
- **Cleanup**: Automatic temporary file cleanup after processing
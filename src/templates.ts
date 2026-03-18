import { Snippet } from './types';

export interface SnippetTemplate extends Partial<Snippet> {
  name: string;
}

export const SNIPPET_TEMPLATES: SnippetTemplate[] = [
  {
    name: 'React Functional Component',
    title: 'New React Component',
    language: 'typescript',
    code: `import React from 'react';

interface Props {
  title: string;
}

export const MyComponent: React.FC<Props> = ({ title }) => {
  return (
    <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
  );
};`,
    description: 'A standard React functional component with TypeScript props.',
    tags: ['react', 'typescript', 'component']
  },
  {
    name: 'Express Route Handler',
    title: 'New Express Route',
    language: 'typescript',
    code: `import { Request, Response } from 'express';

export const getItems = async (req: Request, res: Response) => {
  try {
    const items = await db.collection('items').get();
    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};`,
    description: 'A basic Express.js route handler with error handling.',
    tags: ['express', 'node', 'api']
  },
  {
    name: 'Python Flask API',
    title: 'Flask API Endpoint',
    language: 'python',
    code: `from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/api/data', methods=['GET'])
def get_data():
    data = {
        "status": "success",
        "message": "Hello from Flask!"
    }
    return jsonify(data), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)`,
    description: 'A simple Flask API endpoint with JSON response.',
    tags: ['python', 'flask', 'api']
  },
  {
    name: 'Tailwind Card Component',
    title: 'Tailwind Card',
    language: 'html',
    code: `<div class="max-w-sm rounded overflow-hidden shadow-lg bg-white p-6 border border-gray-200">
  <div class="font-bold text-xl mb-2 text-gray-800">Card Title</div>
  <p class="text-gray-700 text-base">
    This is a simple card component built with Tailwind CSS.
  </p>
  <div class="mt-4">
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Action
    </button>
  </div>
</div>`,
    description: 'A reusable card component using Tailwind CSS utility classes.',
    tags: ['tailwind', 'css', 'html']
  },
  {
    name: 'SQL Create Table',
    title: 'Create Users Table',
    language: 'sql',
    code: `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
    description: 'A standard SQL table definition for user accounts.',
    tags: ['sql', 'database', 'schema']
  }
];

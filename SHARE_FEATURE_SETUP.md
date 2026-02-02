# Share Feature Setup Guide

## 1. Database Setup (Supabase)

Create a new table called `shared_canvas` in your Supabase database:

```sql
-- Create shared_canvas table
CREATE TABLE shared_canvas (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX idx_shared_canvas_created_at ON shared_canvas(created_at DESC);

-- Enable Row Level Security
ALTER TABLE shared_canvas ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (anyone can view shared canvases)
CREATE POLICY "Allow public read access" 
ON shared_canvas 
FOR SELECT 
TO public 
USING (true);

-- Create policy to allow anyone to insert (for sharing)
CREATE POLICY "Allow public insert" 
ON shared_canvas 
FOR INSERT 
TO public 
WITH CHECK (true);
```

## 2. Features Implemented

### ✅ Share Button
- Click "Share" button in the top header
- Generates a unique shareable link
- Saves canvas state to Supabase

### ✅ Share Modal
- Beautiful modal with link preview
- Copy to clipboard functionality
- Open in new tab option
- Loading state while generating
- Success/error notifications

### ✅ Link Generation
- Creates unique IDs: `canvas-{timestamp}-{random}`
- Format: `https://yourdomain.com/shared/{id}`
- Saves entire canvas state (blocks, viewport, etc.)

## 3. Shared Canvas Viewer

✅ Created at `/shared/[id]` - A beautiful read-only viewer for shared canvases

### Features:
- **Read-only view** - Users can view but not edit
- **Pan & Zoom** - Full navigation support
- **Component count** - Shows how many components are in the canvas
- **Watermark** - "Created with InfiniteCanvas" branding
- **Loading states** - Smooth loading experience
- **Error handling** - Friendly error messages if canvas not found
- **Back navigation** - Easy return to main editor

## 4. How to Use

### Sharing a Canvas:
1. Create components on your canvas
2. Click the green "Share" button in the top header
3. Wait for the link to generate
4. Copy the link and share with anyone!

### Viewing a Shared Canvas:
1. Open the shared link
2. View all components in read-only mode
3. Pan and zoom to explore
4. Click "Back to Editor" to create your own canvas

## 5. Testing

1. **Create the database table** using the SQL above
2. **Restart your Next.js dev server** to recognize the new route
3. **Add some components** to your canvas
4. **Click Share** button
5. **Copy the generated link**
6. **Open the link** in a new tab or share with others

## 6. Security Notes

- ✅ Public read access enabled (anyone with link can view)
- ✅ Public insert access enabled (to create share links)
- ❌ No delete access (shares are permanent)
- ❌ No update access (shares cannot be modified)

The shared links are **permanent** and cannot be deleted or edited once created. This ensures that shared links remain valid forever.

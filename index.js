 const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// Connect to MongoDB with error handling
async function connectDB() {
    try {
        await mongoose.connect('mongodb+srv://mythilip2023cse:Mythili%4013@mythili.avtia.mongodb.net/');
        console.log('Successfully connected to MongoDB.');
    } catch (err) {n
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

connectDB();

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectDB();
});

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String },
});

const User = mongoose.model('User', UserSchema);

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('Registering new user:', { username, password });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        console.log('User registered successfully:', { username });
        res.status(200).json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Registration failed' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Logging in user:', { username, password });
    const user = await User.findOne({ username });
    try {
       
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', { username });
            return res.status(401).json({ message: 'Invalid password' });
        }
        console.log('User logged in successfully:', { username });
        res.status(200).json({ message: 'Login Successful' });
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ message: 'Login failed' });
    }
});

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
});

const Post = mongoose.model('Post', PostSchema);

app.post('/createpost', async (req, res) => {
    const { title, content, author } = req.body;
    console.log('Creating new post:', { title, content, author });
    
    if (!title || !content || !author) {
        console.log('Missing required fields:', { title, content, author });
        return res.status(400).json({ message: 'Title, content, and author are required.' });
    }

    try {
        const newPost = new Post({ 
            title, 
            content, 
            author,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await newPost.save();
        console.log('Post created successfully:', newPost);
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Error creating post', error: error.message });
    }
});

// Get all posts
app.get('/post', async (req, res) => {
    try {
        console.log('Fetching all posts');
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .select('title content author createdAt updatedAt');
        
        console.log(`Found ${posts.length} posts`);
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts', error: error.message });
    }
});

// Get single post by ID
app.get('/post/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ 
            message: 'Error fetching post', 
            error: error.message 
        });
    }
});

// Update post
app.put('/post/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, author } = req.body;
        
        console.log('Updating post with id:', id);
        console.log('Update data:', { title, content, author });

        // Validate required fields
        if (!title || !content || !author) {
            console.log('Missing required fields:', { title, content, author });
            return res.status(400).json({ 
                message: 'All fields are required (title, content, author)' 
            });
        }

        // Check if post exists
        const existingPost = await Post.findById(id);
        if (!existingPost) {
            console.log('Post not found:', id);
            return res.status(404).json({ message: 'Post not found' });
        }

        // Update the post
        const updatedPost = await Post.findByIdAndUpdate(
            id,
            { 
                title, 
                content, 
                author,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        console.log('Post updated successfully:', updatedPost);
        res.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid post ID format' });
        }
        res.status(500).json({ 
            message: 'Error updating post', 
            error: error.message 
        });
    }
});

// Delete post
app.delete('/post/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Deleting post with id:', id);

        const deletedPost = await Post.findByIdAndDelete(id);
        if (!deletedPost) {
            console.log('Post not found:', id);
            return res.status(404).json({ message: 'Post not found' });
        }

        console.log('Post deleted successfully:', deletedPost);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ 
            message: 'Error deleting post', 
            error: error.message 
        });
    }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

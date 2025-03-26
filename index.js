const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: 'https://blogs-two-ashen.vercel.app',
    credentials: true
}));
app.use(express.json());

async function connectDB() {
    try {
        await mongoose.connect('mongodb+srv://mythilip2023cse:Mythili%4013@mythili.avtia.mongodb.net/');
        console.log('Successfully connected to MongoDB.');
    } catch (err) {
        process.exit(1);
    }
}

connectDB();

mongoose.connection.on('error', err => console.error(err));
mongoose.connection.on('disconnected', connectDB);

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
});
const Post = mongoose.model('Post', PostSchema);

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });

        const newUser = new User({ username, password });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        const user = await User.findOne({ username, password });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        res.json({ message: 'Login successful', username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

app.post('/createpost', async (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author) {
        return res.status(400).json({ message: 'Title, content, and author are required' });
    }
    try {
        const newPost = new Post({ title, content, author, createdAt: new Date(), updatedAt: new Date() });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: 'Error creating post' });
    }
});

app.get('/post', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching posts' });
    }
});

app.get('/post/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching post' });
    }
});

app.put('/post/:id', async (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, { title, content, author, updatedAt: new Date() }, { new: true });
        if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: 'Error updating post' });
    }
});

app.delete('/post/:id', async (req, res) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (!deletedPost) return res.status(404).json({ message: 'Post not found' });
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting post' });
    }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

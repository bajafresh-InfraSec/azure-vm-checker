import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Blog.css';
import { blogPosts } from '../../data/blog-posts/index';

const Blog = () => {
  const navigate = useNavigate();

  return (
    <div className="blog-container">
      <a href="/" className="back-link">← Back to VM Checker</a>

      <header className="blog-header">
        <h1>AZSize Blog</h1>
        <p>Tips, guides, and best practices for Azure VM management</p>
      </header>

      <div className="blog-posts-grid">
        {blogPosts.map((post) => (
          <article key={post.slug} className="blog-post-card" onClick={() => navigate(`/blog/${post.slug}`)}>
            <div className="post-meta">
              <span className="post-date">{post.date}</span>
              <span className="post-readtime">{post.readTime}</span>
            </div>
            <h2>{post.title}</h2>
            <p className="post-excerpt">{post.excerpt}</p>
            <div className="post-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            <button className="read-more">Read More →</button>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Blog;

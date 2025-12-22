import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BlogPost.css';
import { blogPosts } from '../../data/blog-posts/index';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="blog-post-container">
        <div className="post-not-found">
          <h1>Post Not Found</h1>
          <button onClick={() => navigate('/blog')} className="btn-primary">
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const PostContent = post.component;

  return (
    <div className="blog-post-container">
      <a href="/blog" className="back-link">← Back to Blog</a>

      <article className="blog-post">
        <header className="post-header">
          <div className="post-meta">
            <span className="post-date">{post.date}</span>
            <span className="separator">•</span>
            <span className="post-readtime">{post.readTime}</span>
          </div>
          <h1>{post.title}</h1>
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </header>

        <div className="post-content">
          <PostContent />
        </div>

        <footer className="post-footer">
          <div className="share-section">
            <h3>Found this helpful?</h3>
            <p>Try AZSize to check Azure VM availability across all regions</p>
            <button onClick={() => navigate('/')} className="btn-cta">
              Try AZSize Now →
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
};

export default BlogPost;

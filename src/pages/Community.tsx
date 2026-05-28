import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageCircle, Share2, Plus, Search, Camera, Image as ImageIcon, X, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter as DialogFooterUI } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  updateDoc,
  increment,
  runTransaction
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { CommunityPost, CommunityComment } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import SafeImage from '@/components/SafeImage';

export default function Community() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', description: '' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [newComment, setNewComment] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityPost[];
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'likes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const likes = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId === user.uid) {
          likes.add(data.postId);
        }
      });
      setUserLikes(likes);
    });

    return () => unsubscribe();
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.title || !newPost.description) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName || 'Farmer',
        authorPhoto: user.photoURL || '',
        title: newPost.title,
        description: newPost.description,
        image: selectedImage || '',
        likesCount: 0,
        commentsCount: 0,
        createdAt: Date.now()
      });
      
      toast.success('Post created successfully!');
      setIsPostModalOpen(false);
      setNewPost({ title: '', description: '' });
      setSelectedImage(null);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const likeId = `${user.uid}_${postId}`;
    const likeRef = doc(db, 'likes', likeId);
    const postRef = doc(db, 'posts', postId);

    try {
      if (userLikes.has(postId)) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, {
          postId,
          userId: user.uid,
          createdAt: Date.now()
        });
        await updateDoc(postRef, { likesCount: increment(1) });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const loadComments = (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);
    const q = query(collection(db, `posts/${postId}/comments`), orderBy('createdAt', 'asc'));
    onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityComment[];
      setComments(prev => ({ ...prev, [postId]: commentsData }));
    });
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      await addDoc(collection(db, `posts/${postId}/comments`), {
        postId,
        authorId: user.uid,
        authorName: user.displayName || 'Farmer',
        text: newComment,
        createdAt: Date.now()
      });
      await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/community?post=${postId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Farmer Community">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Search and Post */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search discussions..." 
              className="pl-10 rounded-xl border-emerald-100 bg-white" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
            <DialogTrigger
              render={
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 shadow-lg shadow-emerald-600/20">
                  <Plus className="h-4 w-4" />
                  Ask Question
                </Button>
              }
            />
            <DialogContent className="rounded-[24px] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-emerald-900">Ask the Community</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePost} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Input 
                    placeholder="What is your question? (Title)" 
                    className="rounded-xl border-emerald-100"
                    value={newPost.title}
                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Describe your problem or share details..." 
                    className="rounded-xl border-emerald-100 min-h-[120px]"
                    value={newPost.description}
                    onChange={(e) => setNewPost(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
                
                {selectedImage && (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-100">
                    <img src={selectedImage} alt="Preview" className="w-full h-48 object-cover" />
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="icon-sm" 
                      className="absolute top-2 right-2 rounded-full"
                      onClick={() => setSelectedImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1 rounded-xl border-emerald-100 text-emerald-700 gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Gallery
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1 rounded-xl border-emerald-100 text-emerald-700 gap-2"
                    onClick={() => {
                      fileInputRef.current?.setAttribute('capture', 'environment');
                      fileInputRef.current?.click();
                    }}
                  >
                    <Camera className="h-4 w-4" />
                    Camera
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageSelect}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 text-lg font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? 'Posting...' : 'Post Question'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-[24px] overflow-hidden bg-white">
                  <CardHeader className="p-5 pb-3 flex flex-row items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-emerald-50 shadow-sm">
                      <AvatarImage src={post.authorPhoto} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                        {post.authorName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{post.authorName}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(post.createdAt)} ago
                        </span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-emerald-50 text-emerald-700 border-none">
                          Farmer
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-5 pt-0 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {post.description}
                      </p>
                    </div>
                    
                    {post.image && (
                      <div className="rounded-2xl overflow-hidden border border-emerald-50">
                        <SafeImage src={post.image} alt={post.title} className="w-full max-h-[400px] object-cover" />
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex flex-col border-t border-emerald-50">
                    <div className="flex justify-between w-full py-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`flex-1 gap-2 h-10 rounded-xl transition-colors ${userLikes.has(post.id) ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-emerald-600'}`}
                        onClick={() => handleLike(post.id)}
                      >
                        <ThumbsUp className={`h-5 w-5 ${userLikes.has(post.id) ? 'fill-current' : ''}`} />
                        <span className="font-bold">{post.likesCount || 0}</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`flex-1 gap-2 h-10 rounded-xl transition-colors ${activeCommentsPostId === post.id ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-emerald-600'}`}
                        onClick={() => loadComments(post.id)}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="font-bold">{post.commentsCount || 0}</span>
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-gray-500 hover:text-emerald-600 h-10 rounded-xl"
                        onClick={() => handleShare(post.id)}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {activeCommentsPostId === post.id && (
                      <div className="w-full pt-4 space-y-4 border-t border-emerald-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-bold">
                                  {comment.authorName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold text-gray-900">{comment.authorName}</span>
                                  <span className="text-[10px] text-gray-500">
                                    {formatDistanceToNow(comment.createdAt)} ago
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Input 
                            placeholder="Write a comment..." 
                            className="rounded-xl border-emerald-100 bg-gray-50"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          />
                          <Button 
                            size="icon" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shrink-0"
                            onClick={() => handleAddComment(post.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

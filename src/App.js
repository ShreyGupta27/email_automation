import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, Plus, Trash2, Upload, X, Play, Pause, Save, Folder, FolderPlus, 
  ChevronRight, Eye, Bold, Italic, Underline, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Image as ImageIcon,
  Paperclip, Palette, Video, FileAudio, File, Users,
  BarChart2, Clock, Bell, Layout, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const N8N_URL = process.env.REACT_APP_N8N_URL || 'http://localhost:5678';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// ==================== TOAST NOTIFICATION ====================

const Toast = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-100 flex flex-col gap-2">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-600' :
          toast.type === 'error'   ? 'bg-red-600' :
          toast.type === 'warning' ? 'bg-yellow-600' : 'bg-indigo-600'
        }`}
      >
        {toast.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
        {toast.type === 'error'   && <XCircle className="w-4 h-4 shrink-0" />}
        {toast.type === 'warning' && <AlertCircle className="w-4 h-4 shrink-0" />}
        {toast.type === 'info'    && <Bell className="w-4 h-4 shrink-0" />}
        <span>{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
          <X className="w-3 h-3" />
        </button>
      </div>
    ))}
  </div>
);

// ==================== EMAIL TEMPLATES ====================

const EMAIL_TEMPLATES = [
  {
    id: 'saas-outreach',
    name: 'SaaS Outreach',
    category: 'Sales',
    steps: [
      {
        day: 1,
        title: 'Initial Outreach',
        subject: 'Quick question about {{companyName}}',
        content: `<p>Hi {{firstName}},</p><p>I came across {{companyName}} and was impressed by what you're building.</p><p>I'm reaching out because we help companies like yours <strong>reduce manual work by 40%</strong> through automation.</p><p>Would you be open to a 15-minute call this week to see if there's a fit?</p><p>Best,<br/>Your Name</p>`,
      },
      {
        day: 3,
        title: 'Follow Up',
        subject: 'Re: Quick question about {{companyName}}',
        content: `<p>Hi {{firstName}},</p><p>Just wanted to follow up on my previous email. I know things get busy.</p><p>I'd love to show you how we've helped similar companies in the {{domain}} space save 10+ hours per week.</p><p>Worth a quick chat?</p><p>Best,<br/>Your Name</p>`,
      },
      {
        day: 7,
        title: 'Final Touch',
        subject: 'Last note â€” {{companyName}}',
        content: `<p>Hi {{firstName}},</p><p>I'll keep this short â€” I don't want to clutter your inbox.</p><p>If saving time on repetitive tasks isn't a priority right now, totally understand. Just reply "not now" and I won't reach out again.</p><p>But if you're curious, I'm happy to share a quick demo.</p><p>Best,<br/>Your Name</p>`,
      },
    ],
  },
  {
    id: 'job-inquiry',
    name: 'Job Inquiry',
    category: 'Recruiting',
    steps: [
      {
        day: 1,
        title: 'Introduction',
        subject: 'Interested in opportunities at {{companyName}}',
        content: `<p>Hi {{firstName}},</p><p>I'm a software engineer with 3+ years of experience in full-stack development and I've been following {{companyName}}'s work closely.</p><p>I'd love to explore if there are any opportunities where I could contribute to your team.</p><p>Would you have 10 minutes for a quick call?</p><p>Best regards,<br/>Your Name</p>`,
      },
      {
        day: 5,
        title: 'Follow Up',
        subject: 'Following up â€” {{companyName}}',
        content: `<p>Hi {{firstName}},</p><p>I wanted to follow up on my previous message. I'm genuinely excited about the work {{companyName}} is doing and believe my background in [your skills] could be a strong fit.</p><p>Happy to share my portfolio or resume if helpful.</p><p>Thanks,<br/>Your Name</p>`,
      },
    ],
  },
  {
    id: 'partnership',
    name: 'Partnership Pitch',
    category: 'Business Development',
    steps: [
      {
        day: 1,
        title: 'Partnership Intro',
        subject: 'Partnership opportunity â€” {{companyName}} x [Your Company]',
        content: `<p>Hi {{firstName}},</p><p>I lead partnerships at [Your Company] and I think there's a compelling opportunity for {{companyName}} and us to collaborate.</p><p>Our audiences overlap significantly and a joint initiative could drive value for both sides.</p><p>Open to a brief call to explore?</p><p>Best,<br/>Your Name</p>`,
      },
      {
        day: 4,
        title: 'Follow Up',
        subject: 'Re: Partnership opportunity',
        content: `<p>Hi {{firstName}},</p><p>Following up on my note from earlier this week. I've put together a short one-pager on what a partnership could look like â€” happy to share it if you're interested.</p><p>Best,<br/>Your Name</p>`,
      },
    ],
  },
];

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fontSize, setFontSize] = useState('16');

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertImage = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = `<img src="${evt.target.result}" style="max-width: 100%; height: auto; border-radius: 4px;" />`;
        document.execCommand('insertHTML', false, img);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800">
      <div className="bg-gray-900 border-b border-gray-700 p-2 flex flex-wrap gap-1">
        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <button
            onClick={() => execCommand('bold')}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('italic')}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('underline')}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <select
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              execCommand('fontSize', e.target.value);
            }}
            className="bg-gray-800 text-sm px-2 py-1 rounded border border-gray-700"
          >
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>
        </div>

        <div className="flex gap-1 border-r border-gray-700 pr-2 relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-12 left-0 bg-gray-800 border border-gray-700 rounded p-2 z-10 grid grid-cols-5 gap-1 shadow-lg">
              {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#808080', '#FFA500'].map(color => (
                <button
                  key={color}
                  onClick={() => {
                    execCommand('foreColor', color);
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded border border-gray-600"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <button
            onClick={() => execCommand('justifyLeft')}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('justifyCenter')}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('justifyRight')}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <button
            onClick={() => execCommand('insertUnorderedList')}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCommand('insertOrderedList')}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 border-r border-gray-700 pr-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={insertImage}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 relative">
          <button
            onClick={() => setShowLinkDialog(!showLinkDialog)}
            className="p-2 text-white hover:bg-gray-700 rounded"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          {showLinkDialog && (
            <div className="absolute top-12 left-0 bg-gray-800 border border-gray-700 rounded p-3 z-10 w-64 shadow-lg">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={insertLink}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm text-white"
                >
                  Insert
                </button>
                <button
                  onClick={() => {
                    setShowLinkDialog(false);
                    setLinkUrl('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto focus:outline-none text-white"
          style={{ wordWrap: 'break-word' }}
          suppressContentEditableWarning
        />
        {!value && (
          <div className="absolute top-4 left-4 text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

const ColdEmailWorkflow = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [sequences, setSequences] = useState([]);
  const [folders, setFolders] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [currentSequence, setCurrentSequence] = useState({
    name: '',
    folderId: null,
    sendTime: '09:00',
    sendDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    steps: [
      {
        day: 1,
        title: 'Outreach',
        subject: '',
        content: '',
        attachments: []
      }
    ]
  });
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewStep, setPreviewStep] = useState(null);
  const [viewingSequence, setViewingSequence] = useState(null);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [emailList, setEmailList] = useState([]);
  const [modalStep, setModalStep] = useState('emails');
  const [editableSequence, setEditableSequence] = useState(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [recipients, setRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    designation: '',
    companyName: '',
    domain: ''
  });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    loadData();
    loadRecipients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== DATABASE API CALLS ====================

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/recipients`);
      if (response.ok) {
        const data = await response.json();
        setRecipients(data);
      } else {
        console.error('Failed to load recipients');
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
      addToast('Failed to connect to database. Make sure the backend server is running on port 3001.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = async () => {
    if (!newRecipient.email.trim()) {
      addToast('Please enter an email address', 'warning');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/recipients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecipient)
      });

      if (response.ok) {
        const data = await response.json();
        setRecipients([data, ...recipients]);
        setNewRecipient({ firstName: '', lastName: '', email: '', designation: '', companyName: '', domain: '' });
        addToast('Recipient added successfully!', 'success');
      } else {
        const error = await response.json();
        addToast(error.error || 'Failed to add recipient', 'error');
      }
    } catch (error) {
      console.error('Error adding recipient:', error);
      addToast('Failed to add recipient. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipient = async (id) => {
    if (!window.confirm('Delete this recipient?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/recipients/${id}`, { method: 'DELETE' });

      if (response.ok) {
        setRecipients(recipients.filter(r => r.id !== id));
        addToast('Recipient deleted.', 'success');
      } else {
        addToast('Failed to delete recipient', 'error');
      }
    } catch (error) {
      console.error('Error deleting recipient:', error);
      addToast('Failed to delete recipient. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const bulkAddRecipients = async (newRecipients) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/recipients/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: newRecipients })
      });

      if (response.ok) {
        const data = await response.json();
        setRecipients(prev => [...data.added, ...prev]);
        addToast(data.message, 'success');
      } else {
        addToast('Failed to add recipients', 'error');
      }
    } catch (error) {
      console.error('Error bulk adding recipients:', error);
      addToast('Failed to add recipients. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==================== OTHER FUNCTIONS ====================

  const toggleRecipientSelection = (id) => {
    if (selectedRecipients.includes(id)) {
      setSelectedRecipients(selectedRecipients.filter(recipientId => recipientId !== id));
    } else {
      setSelectedRecipients([...selectedRecipients, id]);
    }
  };

  const selectAllRecipients = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map(r => r.id));
    }
  };

  const addSelectedRecipients = () => {
    const selected = recipients.filter(r => selectedRecipients.includes(r.id));
    setEmailList(prev => [...prev, ...selected]);
    setSelectedRecipients([]);
  };

  const loadData = () => {
    const savedSeqs = localStorage.getItem('emailSequences');
    const savedFolders = localStorage.getItem('emailFolders');
    
    if (savedSeqs) {
      setSequences(JSON.parse(savedSeqs));
    }
    
    if (savedFolders) {
      const loadedFolders = JSON.parse(savedFolders);
      setFolders(loadedFolders);
      setExpandedFolders(loadedFolders.map(f => f.id));
    } else {
      const defaultFolder = { id: 'default', name: 'My Sequences', created: new Date().toISOString() };
      setFolders([defaultFolder]);
      setExpandedFolders(['default']);
      localStorage.setItem('emailFolders', JSON.stringify([defaultFolder]));
    }
  };

  const saveSequences = (seqs) => {
    localStorage.setItem('emailSequences', JSON.stringify(seqs));
    setSequences(seqs);
  };

  const saveFolders = (folderList) => {
    localStorage.setItem('emailFolders', JSON.stringify(folderList));
    setFolders(folderList);
  };

  const createFolder = () => {
    if (!newFolderName.trim()) {
      addToast('Please enter a folder name', 'warning');
      return;
    }
    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      created: new Date().toISOString()
    };
    saveFolders([...folders, newFolder]);
    setCurrentSequence({ ...currentSequence, folderId: newFolder.id });
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const deleteFolder = (folderId) => {
    const folderSeqs = sequences.filter(s => s.folderId === folderId);
    if (folderSeqs.length > 0) {
      if (!window.confirm(`This folder contains ${folderSeqs.length} sequence(s). Delete anyway?`)) return;
      saveSequences(sequences.filter(s => s.folderId !== folderId));
    }
    saveFolders(folders.filter(f => f.id !== folderId));
  };

  const toggleFolder = (folderId) => {
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter(id => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]);
    }
  };

  const addStep = () => {
    const lastDay = currentSequence.steps[currentSequence.steps.length - 1]?.day || 0;
    setCurrentSequence({
      ...currentSequence,
      steps: [...currentSequence.steps, {
        day: lastDay + 1,
        title: '',
        subject: '',
        content: '',
        attachments: []
      }]
    });
  };

  const updateStep = (index, field, value) => {
    const updated = [...currentSequence.steps];
    updated[index][field] = value;
    setCurrentSequence({ ...currentSequence, steps: updated });
  };

  const removeStep = (index) => {
    const updated = currentSequence.steps.filter((_, i) => i !== index);
    setCurrentSequence({ ...currentSequence, steps: updated });
  };

  const handleAttachment = (index, e) => {
    const files = Array.from(e.target.files);
    const updated = [...currentSequence.steps];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const attachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: evt.target.result
        };
        updated[index].attachments = [...(updated[index].attachments || []), attachment];
        setCurrentSequence({ ...currentSequence, steps: updated });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (stepIndex, attachmentIndex) => {
    const updated = [...currentSequence.steps];
    updated[stepIndex].attachments = updated[stepIndex].attachments.filter((_, i) => i !== attachmentIndex);
    setCurrentSequence({ ...currentSequence, steps: updated });
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <FileAudio className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const saveCurrentSequence = () => {
    if (!currentSequence.name.trim()) {
      addToast('Please enter a sequence name', 'warning');
      return;
    }
    if (!currentSequence.folderId) {
      addToast('Please select a folder', 'warning');
      return;
    }
    const newSeq = {
      ...currentSequence,
      id: Date.now(),
      active: false,
      created: new Date().toISOString(),
      recipients: [],
      stats: { active: 0, scheduled: 0, delivered: 0, reply: 0 }
    };
    saveSequences([...sequences, newSeq]);
    setCurrentSequence({
      name: '',
      folderId: folders[0]?.id || null,
      sendTime: '09:00',
      sendDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      steps: [{ day: 1, title: 'Outreach', subject: '', content: '', attachments: [] }]
    });
    addToast('Sequence saved successfully!', 'success');
  };

  // ==================== TEMPLATE FUNCTIONS ====================

  const applyTemplate = (template) => {
    setCurrentSequence({
      ...currentSequence,
      name: template.name,
      steps: template.steps.map(s => ({ ...s, attachments: [] }))
    });
    setShowTemplateModal(false);
    addToast(`Template "${template.name}" applied!`, 'success');
  };

  // ==================== PREVIEW FUNCTION ====================

  const openPreview = (step) => {
    setPreviewStep(step);
    setShowPreviewModal(true);
  };

  // ==================== UNSUBSCRIBE HANDLING ====================
  // eslint-disable-next-line no-unused-vars
  const markUnsubscribed = async (recipientId) => {
    try {
      const response = await fetch(`${API_URL}/recipients/${recipientId}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setRecipients(prev => prev.map(r =>
          r.id === recipientId ? { ...r, unsubscribed: true } : r
        ));
        addToast('Recipient marked as unsubscribed.', 'info');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        
        if (fileName.endsWith('.csv')) {
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const emailIndex = headers.findIndex(h => h.includes('email'));
            const firstNameIndex = headers.findIndex(h => h.includes('first'));
            const lastNameIndex = headers.findIndex(h => h.includes('last'));
            const designationIndex = headers.findIndex(h => h.includes('designation'));
            const companyIndex = headers.findIndex(h => h.includes('company'));
            const domainIndex = headers.findIndex(h => h.includes('domain'));

            const newRecipients = [];
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.trim());
              if (values[emailIndex] && values[emailIndex].includes('@')) {
                newRecipients.push({
                  firstName: values[firstNameIndex] || '',
                  lastName: values[lastNameIndex] || '',
                  email: values[emailIndex],
                  designation: values[designationIndex] || '',
                  companyName: values[companyIndex] || '',
                  domain: values[domainIndex] || ''
                });
              }
            }
            bulkAddRecipients(newRecipients);
          }
        } else {
          const emails = text.split(/[\n,;]/).map(e => e.trim()).filter(e => e.includes('@'));
          const newRecipients = emails.map(email => ({ 
            firstName: '',
            lastName: '',
            email,
            designation: '',
            companyName: '',
            domain: ''
          }));
          bulkAddRecipients(newRecipients);
        }
      };
      reader.readAsText(file);
      return;
    }

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      try {
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        const newRecipients = jsonData.map(row => {
          const email = row['Email Address'] || row['email'] || row['Email'] || '';
          if (email && email.includes('@')) {
            return {
              firstName: row['First Name'] || row['firstName'] || '',
              lastName: row['Last Name'] || row['lastName'] || '',
              email,
              designation: row['Designation'] || row['designation'] || '',
              companyName: row['Company Name'] || row['Company'] || '',
              domain: row['Domain'] || row['domain'] || ''
            };
          }
          return null;
        }).filter(r => r !== null);
        
        bulkAddRecipients(newRecipients);
      } catch (error) {
        alert('Error reading Excel file: ' + error.message);
      }
      return;
    }
  };

  const viewSequence = (seq) => {
    setViewingSequence(seq);
    setShowViewModal(true);
  };

  const activateSequence = (seq) => {
    setSelectedSequence(seq);
    setEditableSequence(JSON.parse(JSON.stringify(seq)));
    setShowActivateModal(true);
    setModalStep('emails');
    setEmailList([]);
    setSelectedRecipients([]);
  };

  const proceedToEdit = () => {
    if (emailList.length === 0) {
      addToast('Please add at least one email address', 'warning');
      return;
    }
    setModalStep('edit');
  };

  const finalizeActivation = async () => {
    try {
      const emailSteps = [];
      for (const recipient of emailList) {
        for (const step of editableSequence.steps) {
          emailSteps.push({
            email: recipient.email,
            subject: step.subject,
            content: step.content,
            day: step.day,
            title: step.title,
            sendTime: editableSequence.sendTime || '09:00',
            sendDays: editableSequence.sendDays || ['mon','tue','wed','thu','fri'],
            recipientData: {
              firstName: recipient.firstName,
              lastName: recipient.lastName,
              designation: recipient.designation,
              companyName: recipient.companyName,
              domain: recipient.domain
            }
          });
        }
      }

      const response = await fetch(`${N8N_URL}/webhook/activate-sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequenceName: editableSequence.name, emailSteps })
      });

      if (response.ok) {
        const updated = sequences.map(s =>
          s.id === selectedSequence.id
            ? { ...s, active: true, recipients: emailList, stats: { ...s.stats, active: emailList.length, scheduled: emailList.length * s.steps.length } }
            : s
        );
        saveSequences(updated);
        setShowActivateModal(false);
        addToast('Sequence activated successfully!', 'success');
      } else {
        throw new Error('Failed to activate sequence');
      }
    } catch (error) {
      addToast('Error: ' + error.message, 'error');
    }
  };

  const deactivateSequence = async (seq) => {
    try {
      await fetch(`${N8N_URL}/webhook/deactivate-sequence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequenceId: seq.id })
      });
      saveSequences(sequences.map(s => s.id === seq.id ? { ...s, active: false } : s));
      addToast('Sequence deactivated.', 'info');
    } catch (error) {
      addToast('Error: ' + error.message, 'error');
    }
  };

  const deleteSequence = (id) => {
    if (window.confirm('Delete this sequence?')) {
      saveSequences(sequences.filter(s => s.id !== id));
      addToast('Sequence deleted.', 'info');
    }
  };

  const updateEditableStep = (index, field, value) => {
    const updated = [...editableSequence.steps];
    updated[index][field] = value;
    setEditableSequence({ ...editableSequence, steps: updated });
  };

  const getSequencesByFolder = (folderId) => sequences.filter(s => s.folderId === folderId);

  return (
    <div className="flex h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 text-white">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="relative h-full w-72 bg-linear-to-b from-indigo-900 to-indigo-800 p-6 shadow-2xl text-white">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white bg-opacity-10 rounded-xl backdrop-blur">
              <Mail className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">EmailFlow</h1>
            </div>
          </div>
        </div>
        <nav className="space-y-3">
          <button
            onClick={() => setActiveTab('create')}
            className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-200 ${
              activeTab === 'create' 
                ? 'bg-black text-white shadow-lg scale-105' 
                : 'text-indigo-100 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create Sequence</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('recipients')}
            className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-200 ${
              activeTab === 'recipients' 
                ? 'bg-black text-white shadow-lg scale-105' 
                : 'text-indigo-100 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <span className="font-medium">Add Recipients</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-200 ${
              activeTab === 'dashboard' 
                ? 'bg-black text-white shadow-lg scale-105' 
                : 'text-indigo-100 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-200 ${
              activeTab === 'analytics' 
                ? 'bg-black text-white shadow-lg scale-105' 
                : 'text-indigo-100 hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart2 className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </div>
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="fixed top-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            Loading...
          </div>
        )}

        {activeTab === 'create' ? (
          <div className="max-w-6xl mx-auto p-10">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h2 className="text-4xl font-bold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Create Email Sequence
                </h2>
                <p className="text-gray-400">Design your perfect outreach campaign</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-lg font-medium text-white"
              >
                <Layout className="w-4 h-4" />
                Use Template
              </button>
            </div>
            
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-gray-700 mb-6">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block mb-3 text-sm font-semibold text-gray-300">Sequence Name</label>
                  <input
                    type="text"
                    value={currentSequence.name}
                    onChange={(e) => setCurrentSequence({ ...currentSequence, name: e.target.value })}
                    className="w-full bg-gray-900 bg-opacity-50 border border-gray-600 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="e.g., Tech Outreach Campaign"
                  />
                </div>
                <div>
                  <label className="block mb-3 text-sm font-semibold text-gray-300">Folder</label>
                  <div className="flex gap-3">
                    <select
                      value={currentSequence.folderId || ''}
                      onChange={(e) => setCurrentSequence({ ...currentSequence, folderId: e.target.value })}
                      className="flex-1 bg-gray-900 bg-opacity-50 border border-gray-600 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select folder...</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <button
                      onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                      className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-lg text-white"
                    >
                      <FolderPlus className="w-5 h-5" />
                    </button>
                  </div>
                  {showNewFolderInput && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder name..."
                        className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2"
                      />
                      <button onClick={createFolder} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white">Create</button>
                      <button onClick={() => {setShowNewFolderInput(false); setNewFolderName('');}} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white">Cancel</button>
                    </div>
                  )}
                </div>
              </div>

              {/* â”€â”€ Scheduling â”€â”€ */}
              <div className="bg-gray-900 bg-opacity-60 border border-gray-700 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-gray-200">Send Schedule</h3>
                </div>
                <div className="flex flex-wrap gap-6 items-center">
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Send Time</label>
                    <input
                      type="time"
                      value={currentSequence.sendTime || '09:00'}
                      onChange={(e) => setCurrentSequence({ ...currentSequence, sendTime: e.target.value })}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Send Days</label>
                    <div className="flex gap-2">
                      {['mon','tue','wed','thu','fri','sat','sun'].map(day => {
                        const active = (currentSequence.sendDays || []).includes(day);
                        return (
                          <button
                            key={day}
                            onClick={() => {
                              const days = currentSequence.sendDays || [];
                              setCurrentSequence({
                                ...currentSequence,
                                sendDays: active ? days.filter(d => d !== day) : [...days, day]
                              });
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition ${
                              active ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {currentSequence.steps.map((step, index) => (
                  <div key={index} className="bg-gray-900 bg-opacity-70 border border-gray-700 rounded-2xl p-6 hover:border-indigo-500 transition-all duration-200">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-linear-to-br from-indigo-600 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg text-white">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">
                            {step.day ? `Day ${step.day}` : 'Day -'}
                          </div>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            className="bg-transparent border-none text-xl font-semibold focus:outline-none text-white"
                            placeholder="Step title..."
                          />
                        </div>
                      </div>
                      {index > 0 && (
                        <button
                          onClick={() => removeStep(index)}
                          className="p-3 text-red-400 hover:bg-red-500 hover:bg-opacity-20 rounded-xl transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => openPreview(step)}
                        className="p-3 text-indigo-400 hover:bg-indigo-500 hover:bg-opacity-20 rounded-xl transition"
                        title="Preview email"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-400">Day</label>
                          <input
                            type="number"
                            min="1"
                            value={step.day || ''}
                            onChange={(e) => updateStep(index, 'day', parseInt(e.target.value) || null)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">Subject Line</label>
                        <input
                          type="text"
                          value={step.subject}
                          onChange={(e) => updateStep(index, 'subject', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter email subject..."
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">Email Content</label>
                        <RichTextEditor
                          value={step.content}
                          onChange={(value) => updateStep(index, 'content', value)}
                          placeholder="Compose your email..."
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">Attachments</label>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="file"
                            id={`attachment-${index}`}
                            onChange={(e) => handleAttachment(index, e)}
                            className="hidden"
                            multiple
                          />
                          <label
                            htmlFor={`attachment-${index}`}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition"
                          >
                            <Paperclip className="w-4 h-4" />
                            <span className="text-sm">Add Attachment</span>
                          </label>
                        </div>
                        {step.attachments && step.attachments.length > 0 && (
                          <div className="space-y-2">
                            {step.attachments.map((att, attIdx) => (
                              <div key={attIdx} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-gray-700 rounded-lg">
                                    {getFileIcon(att.type)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">{att.name}</div>
                                    <div className="text-xs text-gray-400">{formatFileSize(att.size)}</div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeAttachment(index, attIdx)}
                                  className="p-2 text-red-400 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={addStep}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Step
                </button>
                <button
                  onClick={saveCurrentSequence}
                  className="flex items-center gap-2 px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition shadow-lg font-semibold text-white"
                >
                  <Save className="w-5 h-5" />
                  Save Sequence
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'recipients' ? (
          <div className="p-10">
            <div className="mb-8">
              <h2 className="text-4xl font-bold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Manage Recipients
              </h2>
              <p className="text-gray-400">Add and manage your email recipients (Stored in MySQL Database)</p>
            </div>

            <div className="bg-gray-800 bg-opacity-50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-gray-700 mb-6">
              <h3 className="text-xl font-semibold mb-4">Add New Recipient</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-400">First Name</label>
                  <input
                    type="text"
                    value={newRecipient.firstName}
                    onChange={(e) => setNewRecipient({...newRecipient, firstName: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-400">Last Name</label>
                  <input
                    type="text"
                    value={newRecipient.lastName}
                    onChange={(e) => setNewRecipient({...newRecipient, lastName: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-400">Email Address *</label>
                  <input
                    type="email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient({...newRecipient, email: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-400">Designation</label>
                  <input
                    type="text"
                    value={newRecipient.designation}
                    onChange={(e) => setNewRecipient({...newRecipient, designation: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-400">Company Name</label>
                  <input
                    type="text"
                    value={newRecipient.companyName}
                    onChange={(e) => setNewRecipient({...newRecipient, companyName: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Acme Inc"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-400">Domain</label>
                  <input
                    type="text"
                    value={newRecipient.domain}
                    onChange={(e) => setNewRecipient({...newRecipient, domain: e.target.value})}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Technology"
                  />
                </div>
              </div>
              <button
                onClick={addRecipient}
                disabled={loading}
                className="px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition shadow-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Recipient'}
              </button>
            </div>

            <div className="bg-gray-800 bg-opacity-50 backdrop-blur rounded-2xl p-8 shadow-2xl border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Recipients ({recipients.length})</h3>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="recipient-file-upload"
                  />
                  <label
                    htmlFor="recipient-file-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import from File</span>
                  </label>
                </div>
              </div>

              {recipients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900 bg-opacity-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                          <input
                            type="checkbox"
                            checked={selectedRecipients.length === recipients.length && recipients.length > 0}
                            onChange={selectAllRecipients}
                            className="rounded border-gray-600 bg-gray-800"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">First Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Last Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Designation</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Company</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Domain</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {recipients.map((recipient) => (
                        <tr key={recipient.id} className="hover:bg-gray-700 hover:bg-opacity-30 transition">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedRecipients.includes(recipient.id)}
                              onChange={() => toggleRecipientSelection(recipient.id)}
                              className="rounded border-gray-600 bg-gray-800"
                            />
                          </td>
                          <td className="px-4 py-3">{recipient.firstName}</td>
                          <td className="px-4 py-3">{recipient.lastName}</td>
                          <td className="px-4 py-3 font-medium">{recipient.email}</td>
                          <td className="px-4 py-3 text-gray-400">{recipient.designation || '-'}</td>
                          <td className="px-4 py-3 text-gray-400">{recipient.companyName || '-'}</td>
                          <td className="px-4 py-3 text-gray-400">{recipient.domain || '-'}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deleteRecipient(recipient.id)}
                              disabled={loading}
                              className="p-2 text-red-400 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No recipients added yet</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'analytics' ? (
          <div className="p-10">
            <div className="mb-8">
              <h2 className="text-4xl font-bold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Analytics
              </h2>
              <p className="text-gray-400">Campaign performance overview</p>
            </div>

            {(() => {
              const totalSequences = sequences.length;
              const activeSequences = sequences.filter(s => s.active).length;
              const totalRecipients = recipients.length;
              const totalDelivered = sequences.reduce((sum, s) => sum + (s.stats?.delivered || 0), 0);
              const totalReplies = sequences.reduce((sum, s) => sum + (s.stats?.reply || 0), 0);
              const totalScheduled = sequences.reduce((sum, s) => sum + (s.stats?.scheduled || 0), 0);

              const statCards = [
                { label: 'Total Sequences', value: totalSequences, color: 'from-indigo-600 to-indigo-800' },
                { label: 'Active Sequences', value: activeSequences, color: 'from-green-600 to-green-800' },
                { label: 'Total Recipients', value: totalRecipients, color: 'from-purple-600 to-purple-800' },
                { label: 'Emails Delivered', value: totalDelivered, color: 'from-blue-600 to-blue-800' },
                { label: 'Replies', value: totalReplies, color: 'from-yellow-600 to-yellow-800' },
                { label: 'Scheduled', value: totalScheduled, color: 'from-pink-600 to-pink-800' },
              ];

              const barData = sequences.slice(0, 8).map(s => ({
                name: s.name.length > 14 ? s.name.slice(0, 14) + 'â€¦' : s.name,
                Delivered: s.stats?.delivered || 0,
                Scheduled: s.stats?.scheduled || 0,
                Replies: s.stats?.reply || 0,
              }));

              const pieData = [
                { name: 'Active', value: activeSequences || 0 },
                { name: 'Inactive', value: (totalSequences - activeSequences) || 0 },
              ];
              const PIE_COLORS = ['#6366f1', '#374151'];

              const domainData = (() => {
                const counts = {};
                recipients.forEach(r => {
                  const d = r.domain || 'Unknown';
                  counts[d] = (counts[d] || 0) + 1;
                });
                return Object.entries(counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([name, value]) => ({ name, value }));
              })();

              return (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {statCards.map(card => (
                      <div key={card.label} className={`bg-linear-to-br ${card.color} rounded-2xl p-6 shadow-xl`}>
                        <div className="text-3xl font-bold mb-1">{card.value}</div>
                        <div className="text-sm opacity-80">{card.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-6">
                      <h3 className="font-semibold mb-4 text-gray-200">Sequence Performance</h3>
                      {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                            <Legend />
                            <Bar dataKey="Delivered" fill="#6366f1" radius={[4,4,0,0]} />
                            <Bar dataKey="Scheduled" fill="#8b5cf6" radius={[4,4,0,0]} />
                            <Bar dataKey="Replies" fill="#10b981" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-60 flex items-center justify-center text-gray-500">No sequence data yet</div>
                      )}
                    </div>

                    <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-6">
                      <h3 className="font-semibold mb-4 text-gray-200">Active vs Inactive</h3>
                      {totalSequences > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-60 flex items-center justify-center text-gray-500">No sequences yet</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 text-gray-200">Recipients by Domain</h3>
                    {domainData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={domainData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                          <Bar dataKey="value" fill="#6366f1" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-40 flex items-center justify-center text-gray-500">No recipient data yet</div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="p-10">
            <div className="mb-8">
              <h2 className="text-4xl font-bold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Dashboard
              </h2>
              <p className="text-gray-400">Manage your email campaigns</p>
            </div>
            
            <div className="space-y-4">
              {folders.map(folder => {
                const folderSeqs = getSequencesByFolder(folder.id);
                const isExpanded = expandedFolders.includes(folder.id);
                
                return (
                  <div key={folder.id} className="bg-gray-800 bg-opacity-50 backdrop-blur rounded-2xl overflow-hidden shadow-xl border border-gray-700">
                    <div 
                      className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-700 hover:bg-opacity-30 transition"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                        <div className="p-3 bg-indigo-600 bg-opacity-20 rounded-xl">
                          <Folder className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{folder.name}</h3>
                          <p className="text-sm text-gray-400">{folderSeqs.length} sequences</p>
                        </div>
                      </div>
                      {folder.id !== 'default' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                          className="p-3 hover:bg-red-500 hover:bg-opacity-20 rounded-xl text-red-400 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    {isExpanded && folderSeqs.length > 0 && (
                      <div className="border-t border-gray-700">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-900 bg-opacity-50">
                              <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Steps</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Recipients</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Scheduled</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                              {folderSeqs.map((seq) => (
                                <tr key={seq.id} className="hover:bg-gray-700 hover:bg-opacity-30 transition">
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                      seq.active 
                                        ? 'bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-30' 
                                        : 'bg-gray-600 bg-opacity-20 text-gray-300 border border-gray-600 border-opacity-30'
                                    }`}>
                                      {seq.active ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-medium">{seq.name}</td>
                                  <td className="px-6 py-4 text-gray-400">{seq.steps.length}</td>
                                  <td className="px-6 py-4 text-gray-400">{seq.recipients?.length || 0}</td>
                                  <td className="px-6 py-4 text-gray-400">{seq.stats.scheduled}</td>
                                  <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => viewSequence(seq)}
                                        className="p-2 bg-blue-600 bg-opacity-20 hover:bg-opacity-40 text-blue-400 rounded-lg transition"
                                        title="View"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      {!seq.active ? (
                                        <button
                                          onClick={() => activateSequence(seq)}
                                          className="p-2 bg-green-600 bg-opacity-20 hover:bg-opacity-40 text-green-400 rounded-lg transition"
                                          title="Activate"
                                        >
                                          <Play className="w-4 h-4" />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => deactivateSequence(seq)}
                                          className="p-2 bg-yellow-600 bg-opacity-20 hover:bg-opacity-40 text-yellow-400 rounded-lg transition"
                                          title="Deactivate"
                                        >
                                          <Pause className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => deleteSequence(seq.id)}
                                        className="p-2 bg-red-600 bg-opacity-20 hover:bg-opacity-40 text-red-400 rounded-lg transition"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {isExpanded && folderSeqs.length === 0 && (
                      <div className="p-12 text-center text-gray-500 border-t border-gray-700">
                        <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No sequences in this folder yet</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showViewModal && viewingSequence && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-linear-to-r from-indigo-900 to-purple-900 text-white">
              <h3 className="text-2xl font-bold">{viewingSequence.name}</h3>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  Email Steps ({viewingSequence.steps.length})
                </h4>
                <div className="space-y-4">
                  {viewingSequence.steps.map((step, index) => (
                    <div key={index} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-linear-to-br from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">Day {step.day || '-'} - {step.title}</div>
                          <div className="text-sm text-gray-400">Subject: {step.subject}</div>
                        </div>
                      </div>
                      <div className="ml-13 text-sm text-gray-300 bg-gray-900 p-4 rounded-lg" dangerouslySetInnerHTML={{ __html: step.content }} />
                      {step.attachments && step.attachments.length > 0 && (
                        <div className="ml-13 mt-3">
                          <p className="text-xs text-gray-400 mb-2">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {step.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 text-xs">
                                {getFileIcon(att.type)}
                                <span>{att.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-4">Recipients ({viewingSequence.recipients?.length || 0})</h4>
                {viewingSequence.recipients && viewingSequence.recipients.length > 0 ? (
                  <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                    <table className="w-full">
                      <thead className="bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm">Email</th>
                          <th className="px-4 py-3 text-left text-sm">Name</th>
                          <th className="px-4 py-3 text-left text-sm">Designation</th>
                          <th className="px-4 py-3 text-left text-sm">Company</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {viewingSequence.recipients.map((r, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-sm">{r.email}</td>
                            <td className="px-4 py-3 text-sm">{r.firstName} {r.lastName}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{r.designation || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{r.companyName || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400 border border-gray-700">
                    No recipients yet. Activate to add recipients.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showActivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-linear-to-r from-indigo-900 to-purple-900 text-white">
              <h3 className="text-2xl font-bold">
                {modalStep === 'emails' ? 'Select Recipients' : 'Review Sequence'}
              </h3>
              <button onClick={() => setShowActivateModal(false)} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {modalStep === 'emails' ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold">Select Recipients from Database ({selectedRecipients.length} selected)</h4>
                      <button
                        onClick={addSelectedRecipients}
                        disabled={selectedRecipients.length === 0}
                        className={`px-4 py-2 rounded-lg transition ${
                          selectedRecipients.length === 0
                            ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        Add Selected to Sequence
                      </button>
                    </div>

                    {recipients.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={selectedRecipients.length === recipients.length && recipients.length > 0}
                                  onChange={selectAllRecipients}
                                  className="rounded border-gray-600 bg-gray-700"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">First Name</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Last Name</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Designation</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Company</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {recipients.map((recipient) => (
                              <tr key={recipient.id} className="hover:bg-gray-800 transition">
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedRecipients.includes(recipient.id)}
                                    onChange={() => toggleRecipientSelection(recipient.id)}
                                    className="rounded border-gray-600 bg-gray-700"
                                  />
                                </td>
                                <td className="px-4 py-3">{recipient.firstName}</td>
                                <td className="px-4 py-3">{recipient.lastName}</td>
                                <td className="px-4 py-3 font-medium">{recipient.email}</td>
                                <td className="px-4 py-3 text-gray-400">{recipient.designation || '-'}</td>
                                <td className="px-4 py-3 text-gray-400">{recipient.companyName || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400 border border-gray-700">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No recipients available. Add recipients first in the "Add Recipients" tab.</p>
                      </div>
                    )}
                  </div>

                  {emailList.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold">Selected for Sequence ({emailList.length})</h4>
                        <button onClick={() => setEmailList([])} className="text-sm text-red-400 hover:text-red-300">
                          Clear All
                        </button>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-4 max-h-60 overflow-auto border border-gray-700">
                        {emailList.map((r, i) => (
                          <div key={i} className="flex justify-between items-center text-sm py-2 border-b border-gray-700 last:border-b-0">
                            <div>
                              {r.email} 
                              {r.firstName && ` - ${r.firstName} ${r.lastName}`}
                              {r.designation && `, ${r.designation}`}
                              {r.companyName && ` at ${r.companyName}`}
                            </div>
                            <button onClick={() => setEmailList(emailList.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={proceedToEdit}
                    disabled={emailList.length === 0}
                    className={`w-full py-3 rounded-xl font-semibold transition ${
                      emailList.length === 0 
                        ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                        : 'bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                    }`}
                  >
                    Next: Review Sequence
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {editableSequence.steps.map((step, index) => (
                    <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-linear-to-br from-indigo-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white">
                          {index + 1}
                        </div>
                        <div className="text-sm text-gray-400">Day {step.day || '-'} - {step.title}</div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-400">Subject</label>
                          <input
                            type="text"
                            value={step.subject}
                            onChange={(e) => updateEditableStep(index, 'subject', e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-400">Content</label>
                          <div className="bg-gray-900 border border-gray-600 rounded-lg p-4" dangerouslySetInnerHTML={{ __html: step.content }} />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={finalizeActivation}
                    className="w-full py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-semibold transition shadow-lg text-white"
                  >
                    Activate Sequence
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Template Modal â”€â”€ */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-auto shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-linear-to-r from-indigo-900 to-purple-900">
              <div>
                <h3 className="text-2xl font-bold text-white">Email Templates</h3>
                <p className="text-indigo-300 text-sm mt-1">Start with a proven structure</p>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 grid gap-4">
              {EMAIL_TEMPLATES.map(template => (
                <div key={template.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-indigo-500 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white text-lg">{template.name}</h4>
                        <span className="text-xs px-2 py-0.5 bg-indigo-600 bg-opacity-30 text-indigo-300 rounded-full border border-indigo-500 border-opacity-30">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{template.steps.length} steps Â· Days {template.steps.map(s => s.day).join(', ')}</p>
                    </div>
                    <button
                      onClick={() => applyTemplate(template)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium transition"
                    >
                      Use This
                    </button>
                  </div>
                  <div className="space-y-2">
                    {template.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">{i + 1}</span>
                        <span className="font-medium text-gray-300">Day {step.day}:</span>
                        <span>{step.subject}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Email Preview Modal â”€â”€ */}
      {showPreviewModal && previewStep && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-auto shadow-2xl border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-linear-to-r from-indigo-900 to-purple-900">
              <div>
                <h3 className="text-xl font-bold text-white">Email Preview</h3>
                <p className="text-indigo-300 text-sm mt-1">Day {previewStep.day} Â· {previewStep.title}</p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* Email client-style preview */}
              <div className="bg-white rounded-xl overflow-hidden shadow-xl">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">YN</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">Your Name &lt;you@yourcompany.com&gt;</div>
                      <div className="text-xs text-gray-500">To: recipient@example.com</div>
                    </div>
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    {previewStep.subject || '(No subject)'}
                  </div>
                </div>
                <div
                  className="px-6 py-5 text-gray-800 text-sm leading-relaxed min-h-[200px]"
                  dangerouslySetInnerHTML={{ __html: previewStep.content || '<p style="color:#9ca3af">No content yet.</p>' }}
                />
                {previewStep.attachments && previewStep.attachments.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2 font-medium">ATTACHMENTS</p>
                    <div className="flex flex-wrap gap-2">
                      {previewStep.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700">
                          <File className="w-3 h-3" />
                          {att.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Variables like &#123;&#123;firstName&#125;&#125; will be replaced with actual recipient data when sent.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdEmailWorkflow;

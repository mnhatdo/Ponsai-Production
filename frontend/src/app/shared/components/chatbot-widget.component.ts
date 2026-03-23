import { Component, OnInit, inject, signal, effect, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatMessage } from '@core/services/chatbot.service';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Chatbot Toggle Button -->
    <button 
      class="chatbot-toggle"
      (click)="toggleChat()"
      [class.active]="isOpen()"
    >
      <i *ngIf="!isOpen()" class="gi gi-ui-spark" aria-hidden="true"></i>
      <i *ngIf="isOpen()" class="gi gi-ui-close" aria-hidden="true"></i>
      <span class="notification-badge" *ngIf="!isOpen() && hasNewMessages()">!</span>
    </button>

    <!-- Chatbot Window -->
    <div class="chatbot-window" [class.open]="isOpen()">
      <!-- Header -->
      <div class="chatbot-header">
        <div class="header-content">
          <div class="chatbot-avatar">
            <img src="assets/images/logo.png" alt="Ponsai Logo">
          </div>
          <div class="header-text">
            <h3>Trợ lí Ponsai</h3>
            <p class="status">
              <span class="status-dot" [class.online]="isAvailable()"></span>
              {{ isAvailable() ? 'Online' : 'Đang kết nối' }}
            </p>
          </div>
        </div>
        <button class="btn-close-chat" (click)="toggleChat()">
          <i class="gi gi-ui-close" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Messages -->
      <div class="chatbot-messages" #messagesContainer>
        <!-- Welcome Message -->
        <div class="message bot-message" *ngIf="messages().length === 0">
          <div class="message-bubble">
            <p>Xin chào! Tôi là trợ lý ảo của Ponsai.</p>
            <p>Tôi có thể giúp bạn về:</p>
            <ul>
              <li>Thông tin sản phẩm</li>
              <li>Theo dõi đơn hàng</li>
              <li>Phí vận chuyển</li>
              <li>Thanh toán & khuyến mãi</li>
            </ul>
            <p>Bạn cần hỗ trợ gì không?</p>
          </div>
        </div>

        <!-- Conversation Messages -->
        <div 
          *ngFor="let msg of messages()" 
          class="message"
          [class.user-message]="msg.role === 'user'"
          [class.bot-message]="msg.role === 'assistant'"
        >
          <div class="message-bubble">
            <div class="message-content" [innerHTML]="formatMessage(msg.content)"></div>
            <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div class="message bot-message" *ngIf="isTyping()">
          <div class="message-bubble">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Replies -->
      <div class="quick-replies" *ngIf="quickReplies().length > 0 && messages().length === 0">
        <button 
          *ngFor="let reply of quickReplies()" 
          class="quick-reply-btn"
          (click)="sendQuickReply(reply)"
        >
          {{ reply }}
        </button>
      </div>

      <!-- Input -->
      <div class="chatbot-input">
        <form (submit)="sendMessage($event)">
          <input 
            type="text"
            [(ngModel)]="inputMessage"
            name="message"
            placeholder="Nhập tin nhắn..."
            [disabled]="isTyping()"
            #messageInput
          />
          <button 
            type="submit" 
            class="btn-send"
            [disabled]="!inputMessage.trim() || isTyping()"
          >
            <i class="gi gi-ui-rocket" aria-hidden="true"></i>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* Toggle Button */
    .chatbot-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #153243 0%, #284B63 100%);
      border: none;
      box-shadow: 0 4px 12px rgba(21, 50, 67, 0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.3s ease;
      z-index: 2147483646;
    }

    .chatbot-toggle i,
    .btn-close-chat i,
    .btn-send i {
      display: inline-flex;
    }

    .chatbot-toggle i {
      width: 24px;
      height: 24px;
      font-size: 24px;
    }

    .chatbot-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(21, 50, 67, 0.4);
    }

    .chatbot-toggle.active {
      background: #dc3545;
    }

    .notification-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 12px;
      height: 12px;
      background: #ff4444;
      border-radius: 50%;
      border: 2px solid white;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }

    /* Chatbot Window */
    .chatbot-window {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      transform: translateY(20px) scale(0.95);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s ease;
      z-index: 2147483647;
    }

    .chatbot-window.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: all;
    }

    /* Header */
    .chatbot-header {
      background: linear-gradient(135deg, #153243 0%, #284B63 100%);
      color: white;
      padding: 16px;
      border-radius: 16px 16px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .chatbot-avatar {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      overflow: hidden;
    }

    .chatbot-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header-text h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: white;
    }

    .header-text .status {
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6c757d;
    }

    .status-dot.online {
      background: #28a745;
      animation: blink 2s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .btn-close-chat {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .btn-close-chat i {
      width: 20px;
      height: 20px;
      font-size: 20px;
    }

    .btn-close-chat:hover {
      opacity: 1;
    }

    /* Messages */
    .chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f8f9fa;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message {
      display: flex;
      animation: messageSlide 0.3s ease;
    }

    @keyframes messageSlide {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .user-message {
      justify-content: flex-end;
    }

    .bot-message {
      justify-content: flex-start;
    }

    .message-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 16px;
      position: relative;
    }

    .user-message .message-bubble {
      background: #153243;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .bot-message .message-bubble {
      background: white;
      color: #2f2f2f;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .message-content {
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .message-content p {
      margin: 0 0 8px 0;
    }

    .message-content p:last-child {
      margin-bottom: 0;
    }

    .message-content ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    .message-content li {
      margin: 4px 0;
    }

    .message-time {
      font-size: 11px;
      opacity: 0.6;
      margin-top: 4px;
      text-align: right;
    }

    /* Typing Indicator */
    .typing-indicator {
      display: flex;
      gap: 4px;
      align-items: center;
      height: 20px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6c757d;
      animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.7;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }

    /* Quick Replies */
    .quick-replies {
      padding: 8px 16px;
      background: white;
      border-top: 1px solid #e9ecef;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .quick-reply-btn {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .quick-reply-btn:hover {
      background: #153243;
      color: white;
      border-color: #153243;
    }

    /* Input */
    .chatbot-input {
      padding: 16px;
      background: white;
      border-radius: 0 0 16px 16px;
      border-top: 1px solid #e9ecef;
    }

    .chatbot-input form {
      display: flex;
      gap: 8px;
    }

    .chatbot-input input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #e9ecef;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .chatbot-input input:focus {
      border-color: #153243;
    }

    .chatbot-input input:disabled {
      background: #f8f9fa;
      cursor: not-allowed;
    }

    .btn-send {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #153243;
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-send i {
      width: 20px;
      height: 20px;
      font-size: 20px;
    }

    .btn-send:hover:not(:disabled) {
      background: #0d1f29;
      transform: scale(1.05);
    }

    .btn-send:disabled {
      background: #6c757d;
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Responsive */
    @media (max-width: 576px) {
      .chatbot-window {
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100vh;
        border-radius: 0;
      }

      .chatbot-header {
        border-radius: 0;
      }

      .chatbot-input {
        border-radius: 0;
      }
    }
  `]
})
export class ChatbotWidgetComponent implements OnInit, AfterViewChecked {
  private chatbotService = inject(ChatbotService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  isOpen = signal(false);
  inputMessage = '';
  private shouldScrollToBottom = false;
  hasNewMessages = signal(false);

  // Service signals
  messages = this.chatbotService.messages;
  isTyping = this.chatbotService.isTyping;
  isAvailable = this.chatbotService.isAvailable;
  quickReplies = this.chatbotService.quickReplies;

  constructor() {
    // Watch for new messages when chat is closed
    effect(() => {
      const msgs = this.messages();
      if (!this.isOpen() && msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.role === 'assistant') {
          this.hasNewMessages.set(true);
        }
      }
    });
  }

  ngOnInit(): void {
    this.chatbotService.initialize();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat(): void {
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      this.hasNewMessages.set(false);
      setTimeout(() => {
        this.messageInput?.nativeElement?.focus();
        this.scrollToBottom();
      }, 100);
    }
  }

  sendMessage(event: Event): void {
    event.preventDefault();
    
    const message = this.inputMessage.trim();
    if (!message || this.isTyping()) return;

    this.inputMessage = '';
    this.shouldScrollToBottom = true;

    this.chatbotService.sendMessage(message).subscribe({
      next: () => {
        this.shouldScrollToBottom = true;
      }
    });
  }

  sendQuickReply(reply: string): void {
    this.chatbotService.sendQuickReply(reply).subscribe({
      next: () => {
        this.shouldScrollToBottom = true;
      }
    });
  }

  formatMessage(content: string): string {
    // Convert line breaks to <br>
    return content.replace(/\n/g, '<br>');
  }

  formatTime(timestamp: Date): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '@environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    message: string;
    timestamp: Date;
  };
  error?: string;
  message?: string;
}

export interface ChatbotStatus {
  success: boolean;
  data?: {
    available: boolean;
    model: string;
    provider: string;
    languages: string[];
    features: string[];
  };
}

export interface QuickRepliesResponse {
  success: boolean;
  data?: {
    language: string;
    quickReplies: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/chatbot`;

  // Signals for reactive state
  public messages = signal<ChatMessage[]>([]);
  public isTyping = signal(false);
  public isAvailable = signal(false);
  public quickReplies = signal<string[]>([]);

  /**
   * Initialize chatbot and check availability
   */
  initialize(): void {
    this.checkStatus().subscribe();
    this.loadQuickReplies('vi').subscribe();
  }

  /**
   * Check if chatbot service is available
   */
  checkStatus(): Observable<ChatbotStatus> {
    return this.http.get<ChatbotStatus>(`${this.apiUrl}/status`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.isAvailable.set(response.data.available);
        }
      }),
      catchError(error => {
        console.error('Chatbot status check failed:', error);
        this.isAvailable.set(false);
        return of({ success: false });
      })
    );
  }

  /**
   * Send message to chatbot
   */
  sendMessage(message: string): Observable<ChatResponse> {
    // Add user message to conversation
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMessage]);
    this.isTyping.set(true);

    // Get conversation history (last 10 messages)
    const conversationHistory = this.messages().slice(-10);

    return this.http.post<ChatResponse>(`${this.apiUrl}/message`, {
      message,
      conversationHistory
    }).pipe(
      tap(response => {
        this.isTyping.set(false);
        if (response.success && response.data) {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: response.data.message,
            timestamp: new Date(response.data.timestamp)
          };
          this.messages.update(msgs => [...msgs, assistantMessage]);
        } else {
          // Add error message
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: response.message || 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date()
          };
          this.messages.update(msgs => [...msgs, errorMessage]);
        }
      }),
      catchError(error => {
        this.isTyping.set(false);
        console.error('Chatbot message error:', error);
        
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I am unable to respond right now. Please contact support@ponsai.vn',
          timestamp: new Date()
        };
        this.messages.update(msgs => [...msgs, errorMessage]);
        
        return of({
          success: false,
          error: error.error?.error || 'Failed to send message'
        });
      })
    );
  }

  /**
   * Load quick reply suggestions
   */
  loadQuickReplies(language: 'vi' | 'en' = 'vi'): Observable<QuickRepliesResponse> {
    return this.http.get<QuickRepliesResponse>(`${this.apiUrl}/quick-replies`, {
      params: { language }
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.quickReplies.set(response.data.quickReplies);
        }
      }),
      catchError(error => {
        console.error('Failed to load quick replies:', error);
        return of({ success: false });
      })
    );
  }

  /**
   * Clear conversation history
   */
  clearConversation(): void {
    this.messages.set([]);
  }

  /**
   * Send a quick reply message
   */
  sendQuickReply(reply: string): Observable<ChatResponse> {
    return this.sendMessage(reply);
  }
}


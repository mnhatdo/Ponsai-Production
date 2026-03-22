import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '@core/services/product.service';
import { CartService } from '@core/services/cart.service';
import { Product } from '@models/index';
import { BonsaiHeroComponent } from '@features/home/components/bonsai-hero.component';
import { HomeLoaderComponent } from '@features/home/components/home-loader.component';

interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, BonsaiHeroComponent, HomeLoaderComponent],
  template: `
    <app-home-loader *ngIf="showPageLoader()" (done)="onLoaderDone()"></app-home-loader>

    <!-- Bonsai 3D Hero Section -->
    @defer (on immediate) {
      <app-bonsai-hero></app-bonsai-hero>
    } @placeholder {
      <div style="min-height: 100vh; background: #f8f8f8;"></div>
    }

    @defer (on viewport) {
    <!-- Start Product Section -->
    <div class="product-section">
      <div class="container">
        <div class="row">

          <!-- Featured Products from API -->
          <div class="col-12 col-md-4 col-lg-3 mb-5 mb-md-0" *ngFor="let product of featuredProducts().slice(0, 3)">
            <a class="product-item product-card" [routerLink]="['/product', product._id]">
              <div class="product-image-wrapper">
                <img
                  [src]="product.primaryImage || product.images[0] || 'assets/images/product-1.png'"
                  class="product-thumbnail"
                  [alt]="product.name"
                  loading="lazy"
                >
              </div>
              <div class="product-info">
                <h3 class="product-title">{{ product.name }}</h3>
                <strong class="product-price">{{ formatPrice(product.price, product.originalCurrency) }}</strong>
              </div>
              <span class="icon-cross" (click)="addToCart(product, $event)">
                <img src="assets/icons/add_to_cart.png" class="img-fluid" alt="Add">
              </span>
            </a>
          </div>

        </div>
      </div>
    </div>
    <!-- End Product Section -->
    } @placeholder {
      <div style="min-height: 200px;"></div>
    }

    @defer (on viewport) {
    <!-- Start Why Choose Us Section -->
    <div class="why-choose-section">
      <div class="container">
        <div class="row justify-content-between">
          <div class="col-lg-6">
            <h2 class="section-title">How We Work</h2>
            <p>We keep things simple. Quality plants, honest advice, and tools that last. Everything designed to make plant care feel natural, not complicated.</p>

            <div class="row my-5">
              <div class="col-6 col-md-6">
                <div class="feature">
                  <div class="icon">
                    <img src="assets/images/truck.svg" alt="Fast Shipping" class="imf-fluid">
                  </div>
                  <h3>Shipped with Care</h3>
                  <p>Plants packed securely. Free delivery on orders over $50. Delivery times vary by location.</p>
                </div>
              </div>

              <div class="col-6 col-md-6">
                <div class="feature">
                  <div class="icon">
                    <img src="assets/images/bag.svg" alt="Easy Shopping" class="imf-fluid">
                  </div>
                  <h3>Straightforward Selection</h3>
                  <p>Clear photos, honest descriptions, and care notes for every plant. No guesswork.</p>
                </div>
              </div>

              <div class="col-6 col-md-6">
                <div class="feature">
                  <div class="icon">
                    <img src="assets/images/support.svg" alt="Support" class="imf-fluid">
                  </div>
                  <h3>Ongoing Guidance</h3>
                  <p>Care questions? Reach out anytime. We respond within 24 hours with practical advice.</p>
                </div>
              </div>

              <div class="col-6 col-md-6">
                <div class="feature">
                  <div class="icon">
                    <img src="assets/images/return.svg" alt="Returns" class="imf-fluid">
                  </div>
                  <h3>Simple Returns</h3>
                  <p>Not quite right? Return within 14 days, no complicated process. Plants deserve the right home.</p>
                </div>
              </div>

            </div>
          </div>

          <div class="col-lg-5">
            <div class="img-wrap">
              <img src="assets/images/why-choose-us-img.jpg" alt="Why Choose Us" class="img-fluid">
            </div>
          </div>

        </div>
      </div>
    </div>
    <!-- End Why Choose Us Section -->
    } @placeholder {
      <div style="min-height: 200px;"></div>
    }

    @defer (on viewport) {
    <!-- Start We Help Section -->
    <div class="we-help-section">
      <div class="container">
        <div class="fit-life-header text-center">
          <h2 class="fit-life-title">Plants That Fit Your Life</h2>
        </div>

        <div class="fit-life-grid">
          <div class="fit-life-col fit-life-col-left">
            <div class="fit-life-card fit-life-image-card fit-life-left-top">
              <img src="assets/images/img-grid-1.jpg" alt="Plant detail">
            </div>

            <div class="fit-life-card fit-life-text-card">
              <p>For a team that meticulously crafts every frame, adding greenery is like adding the perfect organic layer to your workspace.</p>
            </div>
          </div>

          <div class="fit-life-col fit-life-col-center">
            <div class="fit-life-card fit-life-image-card fit-life-center-tall">
              <img src="assets/images/img-grid-2.jpg" alt="Creative plant lifestyle">
            </div>
          </div>

          <div class="fit-life-col fit-life-col-right">
            <div class="fit-life-card fit-life-list-card">
              <ul class="list-unstyled mb-0">
                <li>Experienced team of professional growers</li>
                <li>Fast turnaround times & reliable delivery</li>
                <li>Unlimited revisions on selected plans</li>
                <li>Custom editing solutions for every brand</li>
                <li>Consistent, scalable content production</li>
                <li>Modern tools & industry-standard workflows</li>
              </ul>
            </div>

            <div class="fit-life-card fit-life-image-card fit-life-right-bottom">
              <img src="assets/images/img-grid-3.jpg" alt="Happy plant owner">
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- End We Help Section -->
    } @placeholder {
      <div style="min-height: 200px;"></div>
    }

    @defer (on viewport) {
    <!-- Start Popular Product -->
    <div class="popular-product">
      <div class="container">
        <div class="row">

          <div class="col-12 col-md-6 col-lg-4 mb-4 mb-lg-0">
            <div class="product-item-sm d-flex">
              <div class="thumbnail">
                <img src="assets/images/product-1.png" alt="Nordic Chair" class="img-fluid">
              </div>
              <div class="pt-3">
                <h3>Essential Tools</h3>
                <p>Pruning shears, wire cutters, and soil scoops built to last. Designed for daily use, not display.</p>
                <p><a routerLink="/shop">Browse Tools</a></p>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-4 mb-4 mb-lg-0">
            <div class="product-item-sm d-flex">
              <div class="thumbnail">
                <img src="assets/images/product-2.png" alt="Kruzo Aero Chair" class="img-fluid">
              </div>
              <div class="pt-3">
                <h3>Handmade Pots</h3>
                <p>Ceramic and stoneware containers shaped by artisans. Drainage, proportion, and finish that support healthy roots.</p>
                <p><a routerLink="/shop">View Pots</a></p>
              </div>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-4 mb-4 mb-lg-0">
            <div class="product-item-sm d-flex">
              <div class="thumbnail">
                <img src="assets/images/product-3.png" alt="Ergonomic Chair" class="img-fluid">
              </div>
              <div class="pt-3">
                <h3>Growing Media</h3>
                <p>Soil blends, fertilizers, and amendments tailored for bonsai cultivation. Formulated for drainage and nutrition.</p>
                <p><a routerLink="/shop">Shop Supplies</a></p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    <!-- End Popular Product -->
    } @placeholder {
      <div style="min-height: 200px;"></div>
    }

    @defer (on viewport) {
    <!-- Start Testimonial Slider -->
    <div class="testimonial-section">
      <div class="container">
        <div class="row">
          <div class="col-lg-7 mx-auto text-center">
            <h2 class="section-title">Testimonials</h2>
          </div>
        </div>

        <div class="row justify-content-center">
          <div class="col-lg-12">
            <div class="testimonial-slider-wrap text-center">

              <div id="testimonial-nav">
                <button type="button" class="prev testimonial-nav-btn" aria-label="Previous testimonial" (click)="prevTestimonial()"><span class="fa fa-chevron-left"></span></button>
                <button type="button" class="next testimonial-nav-btn" aria-label="Next testimonial" (click)="nextTestimonial()"><span class="fa fa-chevron-right"></span></button>
              </div>

              <div class="testimonial-slider">
                
                <div class="item">
                  <div class="row justify-content-center">
                    <div class="col-lg-8 mx-auto">

                      <div class="testimonial-block text-center">
                        <blockquote class="mb-5">
                          <p>&ldquo;{{ activeTestimonial().quote }}&rdquo;</p>
                        </blockquote>

                        <div class="author-info">
                          <div class="author-pic">
                            <img [src]="activeTestimonial().avatar" [alt]="activeTestimonial().name" class="img-fluid">
                          </div>
                          <h3 class="font-weight-bold">{{ activeTestimonial().name }}</h3>
                          <span class="position d-block mb-3">{{ activeTestimonial().role }}</span>
                        </div>
                        @if (false) {
                        <blockquote class="mb-5">
                          <p>&ldquo;I’ve killed a lot of plants. PONSAI didn’t promise miracles—just honest care info and tools that actually work. Six months in, my first bonsai is still alive. That’s a win.&rdquo;</p>
                        </blockquote>

                        <div class="author-info">
                          <div class="author-pic">
                            <img src="assets/images/person-1.png" alt="Alex Chen" class="img-fluid">
                          </div>
                          <h3 class="font-weight-bold">Alex Chen</h3>
                          <span class="position d-block mb-3">Beginner grower, Seattle</span>
                        </div>
                        }
                      </div>

                    </div>
                  </div>
                </div>
                <!-- END item -->

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- End Testimonial Slider -->
    } @placeholder {
      <div style="min-height: 200px;"></div>
    }

    @defer (on viewport) {
    <!-- Start Blog Section -->
    <div class="blog-section">
      <div class="container">
        <div class="row mb-5">
          <div class="col-md-6">
            <h2 class="section-title">Recent Blog</h2>
          </div>
          <div class="col-md-6 text-start text-md-end">
            <a routerLink="/blog" class="more">View All Posts</a>
          </div>
        </div>

        <div class="row recent-blog-grid">

          <div class="col-12 col-sm-6 col-md-4 mb-4 mb-md-0">
            <div class="post-entry">
              <a href="#" class="post-thumbnail"><img src="assets/images/post-1.jpg" alt="Blog Post" class="img-fluid"></a>
              <div class="post-content-entry">
                <h3><a href="#">Winter Care: What Changes, What Doesn’t</a></h3>
                <div class="meta">
                  <span>by <a href="#">PONSAI Team</a></span> <span>on <a href="#">Jan 5, 2026</a></span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-4 mb-4 mb-md-0">
            <div class="post-entry">
              <a href="#" class="post-thumbnail"><img src="assets/images/post-2.jpg" alt="Blog Post" class="img-fluid"></a>
              <div class="post-content-entry">
                <h3><a href="#">Choosing Your First Bonsai Species</a></h3>
                <div class="meta">
                  <span>by <a href="#">Sarah Kim</a></span> <span>on <a href="#">Dec 28, 2025</a></span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6 col-md-4 mb-4 mb-md-0">
            <div class="post-entry">
              <a href="#" class="post-thumbnail"><img src="assets/images/post-3.jpg" alt="Blog Post" class="img-fluid"></a>
              <div class="post-content-entry">
                <h3><a href="#">Repotting: When and How</a></h3>
                <div class="meta">
                  <span>by <a href="#">Li Zhang</a></span> <span>on <a href="#">Dec 15, 2025</a></span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    <!-- End Blog Section -->
    } @placeholder {
      <div style="min-height: 200px;"></div>
    }
  `,
  styles: [`
    :host {
      display: block;
      scroll-behavior: smooth;
    }

    .product-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: transparent;
      border-radius: 10px;
      overflow: visible;
      transition: all 0.3s ease;
    }

    .product-image-wrapper {
      position: relative;
      width: 100%;
      padding-top: 66.67%;
      overflow: hidden;
      background: #f8f9fa;
      border-radius: 10px;
      margin-bottom: 30px;
      top: 0;
      transition: .3s all ease;
    }

    .product-image-wrapper .product-thumbnail {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }

    .product-info {
      padding: 0 5px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      min-height: 85px;
    }

    .product-info .product-title {
      font-size: 16px;
      font-weight: 600;
      color: #2f2f2f;
      margin-bottom: 8px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      min-height: 40px;
    }

    .product-info .product-price {
      font-size: 18px;
      font-weight: 800;
      color: #2f2f2f;
      margin-top: auto;
    }

    .product-card:hover .product-image-wrapper {
      top: -25px;
    }

    .we-help-section {
      background: #efefef;
      padding: 90px 0;
    }

    .fit-life-header {
      max-width: 720px;
      margin: 0 auto 34px;
    }

    .fit-life-title {
      font-size: 3rem;
      line-height: 1.05;
      letter-spacing: -0.02em;
      margin: 0;
      color: #111;
      font-weight: 600;
    }

    .fit-life-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      align-items: stretch;
    }

    .fit-life-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-height: 0;
    }

    .fit-life-card {
      border-radius: 18px;
      overflow: hidden;
    }

    .fit-life-image-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .fit-life-left-top {
      height: 310px;
      box-shadow: rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;
    }

    .fit-life-center-tall {
      flex: 1;
      min-height: 560px;
      box-shadow: rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;
    }

    .fit-life-list-card {
      padding: 16px 18px;
      background: #f2f2f2;
    }

    .fit-life-text-card {
      padding: 16px 18px;
      background: #f2f2f2;
      min-height: 94px;
      display: flex;
      align-items: center;
    }

    .fit-life-text-card p {
      margin: 0;
      color: #5c5c5c;
      font-size: 14px;
      line-height: 1.45;
    }

    .fit-life-list-card li {
      position: relative;
      padding-left: 14px;
      margin-bottom: 10px;
      color: #4a4a4a;
      font-size: 14px;
      line-height: 1.45;
    }

    .fit-life-list-card li:last-child {
      margin-bottom: 0;
    }

    .fit-life-list-card li::before {
      content: '•';
      position: absolute;
      left: 0;
      top: 0;
      color: #111;
    }

    .fit-life-right-bottom {
      height: 350px;
      box-shadow: rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;
    }

    .fit-life-col-left {
      justify-content: flex-start;
    }

    .fit-life-col-center {
      justify-content: stretch;
    }

    .fit-life-col-right {
      justify-content: space-between;
    }

    @media (max-width: 991px) {
      .we-help-section {
        padding: 70px 0;
      }

      .fit-life-grid {
        grid-template-columns: 1fr;
      }

      .fit-life-left-top,
      .fit-life-center-tall,
      .fit-life-right-bottom {
        height: 320px;
        min-height: 320px;
      }
    }

    .recent-blog-grid > [class*='col-'] {
      display: flex;
    }

    .recent-blog-grid .post-entry {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }

    .recent-blog-grid .post-thumbnail {
      display: block;
      width: 100%;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      border-radius: 18px;
      background: #edf1f4;
      margin-bottom: 1.25rem;
    }

    .recent-blog-grid .post-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }

    .recent-blog-grid .post-content-entry {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .recent-blog-grid .post-content-entry h3 {
      margin-bottom: 0.8rem;
      min-height: calc(1.4em * 2);
      line-height: 1.4;
    }

    .recent-blog-grid .meta {
      margin-top: auto;
    }

    @media (max-width: 767.98px) {
      .recent-blog-grid .post-thumbnail {
        aspect-ratio: 16 / 11;
      }
    }

    .testimonial-nav-btn {
      border: none;
      background: rgba(207, 214, 223, 0.55);
      width: 72px;
      height: 72px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #1f2937;
      transition: transform 0.2s ease, background-color 0.2s ease;
      position: absolute;
      top: 50%;
      z-index: 100;
    }

    .testimonial-nav-btn:hover {
      background: rgba(207, 214, 223, 0.78);
    }

    .testimonial-nav-btn:focus-visible {
      outline: 2px solid #111827;
      outline-offset: 3px;
    }

    .testimonial-nav-btn.prev {
      left: -10px;
      transform: translateY(-50%);
    }

    .testimonial-nav-btn.next {
      right: 0;
      transform: translateY(-50%);
    }

    .testimonial-nav-btn.prev:hover,
    .testimonial-nav-btn.next:hover {
      transform: translateY(calc(-50% - 1px));
    }

    @media (max-width: 767.98px) {
      .testimonial-nav-btn {
        width: 56px;
        height: 56px;
      }

      .testimonial-nav-btn.prev {
        left: 0;
      }

      .testimonial-nav-btn.next {
        right: 0;
      }
    }

  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  showPageLoader = signal<boolean>(true);
  featuredProducts = signal<Product[]>([]);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);
  private loaderFailSafeTimer: number | null = null;
  private testimonialAutoPlayTimer: number | null = null;

  readonly testimonials: TestimonialItem[] = [
    {
      quote: 'I have killed a lot of plants. PONSAI did not promise miracles, just honest care info and tools that actually work. Six months in, my first bonsai is still alive. That is a win.',
      name: 'Alex Chen',
      role: 'Beginner grower, Seattle',
      avatar: 'assets/images/person-1.png'
    },
    {
      quote: 'The pruning set feels premium, and the care guides are specific enough that I stopped second-guessing every cut. My ficus finally looks intentional.',
      name: 'Mia Thompson',
      role: 'Interior stylist, Portland',
      avatar: 'assets/images/person_2.jpg'
    },
    {
      quote: 'What I like most is the practicality. No hype, no vague tips, just the right tools and clear steps. It made bonsai feel approachable from day one.',
      name: 'Daniel Park',
      role: 'Plant hobbyist, Vancouver',
      avatar: 'assets/images/person_3.jpg'
    }
  ];

  activeTestimonialIndex = signal(0);
  activeTestimonial = signal(this.testimonials[0]);

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.loaderFailSafeTimer = window.setTimeout(() => {
      this.showPageLoader.set(false);
    }, 12000);
    this.startTestimonialAutoplay();
  }

  ngOnDestroy(): void {
    if (this.loaderFailSafeTimer !== null) {
      window.clearTimeout(this.loaderFailSafeTimer);
    }
    if (this.testimonialAutoPlayTimer !== null) {
      window.clearInterval(this.testimonialAutoPlayTimer);
    }
  }

  onLoaderDone(): void {
    this.showPageLoader.set(false);
    if (this.loaderFailSafeTimer !== null) {
      window.clearTimeout(this.loaderFailSafeTimer);
      this.loaderFailSafeTimer = null;
    }
  }

  loadFeaturedProducts(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.productService.getProducts({ limit: 6, featured: true }).subscribe({
      next: (response) => {
        this.featuredProducts.set(response.data as any);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading featured products:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
        this.productService.getProducts({ limit: 6 }).subscribe({
          next: (response) => {
            this.featuredProducts.set(response.data as any);
            this.hasError.set(false);
          },
          error: () => {
            this.featuredProducts.set([]);
          }
        });
      }
    });
  }

  addToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (product.inStock) {
      this.cartService.addItem(product, 1);
      alert(`${product.name} added to cart!`);
    }
  }

  formatPrice(price: number, currency?: string): string {
    const currencySymbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      VND: '₫'
    };

    const symbol = currency ? (currencySymbols[currency] || `${currency} `) : '£';
    const formattedPrice = price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return `${symbol}${formattedPrice}`;
  }

  prevTestimonial(): void {
    const nextIndex = (this.activeTestimonialIndex() - 1 + this.testimonials.length) % this.testimonials.length;
    this.setActiveTestimonial(nextIndex);
    this.restartTestimonialAutoplay();
  }

  nextTestimonial(): void {
    const nextIndex = (this.activeTestimonialIndex() + 1) % this.testimonials.length;
    this.setActiveTestimonial(nextIndex);
    this.restartTestimonialAutoplay();
  }

  private setActiveTestimonial(index: number): void {
    this.activeTestimonialIndex.set(index);
    this.activeTestimonial.set(this.testimonials[index]);
  }

  private startTestimonialAutoplay(): void {
    this.testimonialAutoPlayTimer = window.setInterval(() => {
      const nextIndex = (this.activeTestimonialIndex() + 1) % this.testimonials.length;
      this.setActiveTestimonial(nextIndex);
    }, 4500);
  }

  private restartTestimonialAutoplay(): void {
    if (this.testimonialAutoPlayTimer !== null) {
      window.clearInterval(this.testimonialAutoPlayTimer);
    }
    this.startTestimonialAutoplay();
  }
}

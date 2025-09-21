/**
 * Bundle analysis utilities for development
 */

interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
}

interface DependencyInfo {
  name: string;
  size: number;
  version: string;
}

class BundleAnalyzer {
  private stats: BundleStats | null = null;

  // Analyze current bundle (development only)
  async analyzeCurrent(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') return;

    console.group('🔍 Bundle Analysis');
    
    // Analyze loaded scripts
    this.analyzeLoadedScripts();
    
    // Analyze CSS
    this.analyzeLoadedStyles();
    
    // Analyze dependencies
    this.analyzeDependencies();
    
    console.groupEnd();
  }

  private analyzeLoadedScripts(): void {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    
    console.group('📦 JavaScript Bundles');
    
    scripts.forEach((script: HTMLScriptElement) => {
      if (script.src.includes('assets') || script.src.includes('node_modules')) {
        const name = script.src.split('/').pop() || 'unknown';
        console.log(`• ${name}`);
        
        // Try to estimate size (this is approximate)
        fetch(script.src, { method: 'HEAD' })
          .then(response => {
            const size = response.headers.get('content-length');
            if (size) {
              console.log(`  Size: ${this.formatBytes(parseInt(size))}`);
            }
          })
          .catch(() => {
            // Silently handle errors
          });
      }
    });
    
    console.groupEnd();
  }

  private analyzeLoadedStyles(): void {
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    console.group('🎨 CSS Bundles');
    
    styles.forEach((style: HTMLLinkElement) => {
      if (style.href.includes('assets')) {
        const name = style.href.split('/').pop() || 'unknown';
        console.log(`• ${name}`);
      }
    });
    
    console.groupEnd();
  }

  private analyzeDependencies(): void {
    // This would require build-time analysis
    // For now, we'll just list what we know from package.json
    const knownDeps = [
      { name: 'react', estimatedSize: '42KB' },
      { name: 'react-dom', estimatedSize: '130KB' },
      { name: 'react-router', estimatedSize: '25KB' },
      { name: 'framer-motion', estimatedSize: '180KB' },
      { name: 'lucide-react', estimatedSize: '15KB' },
      { name: 'tailwindcss', estimatedSize: '10KB (after purge)' }
    ];

    console.group('📚 Dependencies (Estimated)');
    knownDeps.forEach(dep => {
      console.log(`• ${dep.name}: ${dep.estimatedSize}`);
    });
    console.groupEnd();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check for duplicate dependencies
  checkDuplicates(): void {
    if (process.env.NODE_ENV !== 'development') return;

    console.group('🔍 Checking for Duplicates');
    
    // This is a simplified check - in a real app you'd use webpack-bundle-analyzer
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const scriptNames = scripts.map(s => s.src.split('/').pop()).filter(Boolean);
    
    const duplicates = scriptNames.filter((name, index) => 
      scriptNames.indexOf(name) !== index
    );
    
    if (duplicates.length > 0) {
      console.warn('Potential duplicates found:', duplicates);
    } else {
      console.log('✅ No obvious duplicates detected');
    }
    
    console.groupEnd();
  }

  // Analyze unused code (simplified)
  analyzeUnusedCode(): void {
    if (process.env.NODE_ENV !== 'development') return;

    console.group('🧹 Unused Code Analysis');
    
    // Check for unused CSS classes (simplified)
    const stylesheets = Array.from(document.styleSheets);
    const usedClasses = new Set<string>();
    
    // Get all classes used in DOM
    document.querySelectorAll('*').forEach(el => {
      el.classList.forEach(cls => usedClasses.add(cls));
    });
    
    console.log(`Classes in DOM: ${usedClasses.size}`);
    
    // This is a very basic analysis - real tools would be more sophisticated
    console.log('💡 Use tools like PurgeCSS for detailed unused CSS analysis');
    
    console.groupEnd();
  }

  // Performance recommendations
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for large bundles
    const scripts = document.querySelectorAll('script[src]');
    if (scripts.length > 10) {
      recommendations.push('Consider code splitting - you have many script files');
    }

    // Check for missing lazy loading
    const images = document.querySelectorAll('img:not([loading])');
    if (images.length > 5) {
      recommendations.push('Add lazy loading to images for better performance');
    }

    // Check for missing preload hints
    const criticalResources = document.querySelectorAll('link[rel="preload"]');
    if (criticalResources.length === 0) {
      recommendations.push('Consider preloading critical resources');
    }

    return recommendations;
  }
}

export const bundleAnalyzer = new BundleAnalyzer();

// Auto-analyze in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      bundleAnalyzer.analyzeCurrent();
      bundleAnalyzer.checkDuplicates();
      
      const recommendations = bundleAnalyzer.getRecommendations();
      if (recommendations.length > 0) {
        console.group('💡 Performance Recommendations');
        recommendations.forEach(rec => console.log(`• ${rec}`));
        console.groupEnd();
      }
    }, 1000);
  });
}
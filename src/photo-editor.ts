/**
 * Photo Editor Module - SVG Drawing Tools
 * Provides pencil, rectangle, circle, arrow, and text drawing on photos
 */

interface DrawingState {
  tool: 'pencil' | 'rect' | 'circle' | 'arrow' | 'text';
  color: string;
  size: number;
  isDrawing: boolean;
  startX: number;
  startY: number;
}

interface DrawingAction {
  type: string;
  color: string;
  size: number;
  data: any;
}

class PhotoEditor {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private originalImage: HTMLImageElement | null = null;
  private state: DrawingState = {
    tool: 'pencil',
    color: '#FF0000',
    size: 3,
    isDrawing: false,
    startX: 0,
    startY: 0,
  };
  private actions: DrawingAction[] = [];
  private currentImageData: ImageData | null = null;

  /**
   * Initialize editor with image
   */
  init(imageUrl: string, canvasId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!this.canvas) return reject(new Error('Canvas not found'));

      this.context = this.canvas.getContext('2d');
      if (!this.context) return reject(new Error('Canvas context not available'));

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.originalImage = img;
        this.canvas!.width = img.width;
        this.canvas!.height = img.height;
        this.redraw();
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Set active tool
   */
  setTool(tool: DrawingState['tool']): void {
    this.state.tool = tool;
  }

  /**
   * Set drawing color
   */
  setColor(color: string): void {
    this.state.color = color;
  }

  /**
   * Set brush/line size
   */
  setSize(size: number): void {
    this.state.size = Math.max(1, Math.min(50, size));
  }

  /**
   * Start drawing
   */
  startDrawing(x: number, y: number): void {
    if (!this.canvas || !this.context) return;

    this.state.isDrawing = true;
    this.state.startX = x;
    this.state.startY = y;

    // Save current state for preview
    this.currentImageData = this.context.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    if (this.state.tool === 'pencil') {
      this.context.beginPath();
      this.context.moveTo(x, y);
    } else if (this.state.tool === 'text') {
      // Text tool handled on finish
    }
  }

  /**
   * Handle mouse move for drawing
   */
  draw(x: number, y: number): void {
    if (!this.canvas || !this.context || !this.state.isDrawing) return;

    if (this.state.tool === 'pencil') {
      this.context.strokeStyle = this.state.color;
      this.context.lineWidth = this.state.size;
      this.context.lineCap = 'round';
      this.context.lineJoin = 'round';
      this.context.lineTo(x, y);
      this.context.stroke();
    } else if (
      ['rect', 'circle', 'arrow'].includes(this.state.tool) &&
      this.currentImageData
    ) {
      // Restore background and draw preview
      this.context.putImageData(this.currentImageData, 0, 0);

      this.context.strokeStyle = this.state.color;
      this.context.lineWidth = this.state.size;

      if (this.state.tool === 'rect') {
        const width = x - this.state.startX;
        const height = y - this.state.startY;
        this.context.strokeRect(
          this.state.startX,
          this.state.startY,
          width,
          height
        );
      } else if (this.state.tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(x - this.state.startX, 2) +
            Math.pow(y - this.state.startY, 2)
        );
        this.context.beginPath();
        this.context.arc(
          this.state.startX,
          this.state.startY,
          radius,
          0,
          2 * Math.PI
        );
        this.context.stroke();
      } else if (this.state.tool === 'arrow') {
        this.drawArrow(
          this.state.startX,
          this.state.startY,
          x,
          y,
          this.state.size
        );
      }
    }
  }

  /**
   * Finish drawing action
   */
  finishDrawing(x?: number, y?: number): void {
    if (!this.canvas || !this.context || !this.state.isDrawing) return;

    this.state.isDrawing = false;

    if (this.state.tool === 'pencil') {
      this.context.closePath();
    } else if (this.state.tool === 'text' && x && y) {
      this.addText(x, y);
    } else if (this.state.tool === 'rect' && x && y) {
      const width = x - this.state.startX;
      const height = y - this.state.startY;
      this.context.strokeRect(
        this.state.startX,
        this.state.startY,
        width,
        height
      );
    } else if (this.state.tool === 'circle' && x && y) {
      const radius = Math.sqrt(
        Math.pow(x - this.state.startX, 2) +
          Math.pow(y - this.state.startY, 2)
      );
      this.context.beginPath();
      this.context.arc(
        this.state.startX,
        this.state.startY,
        radius,
        0,
        2 * Math.PI
      );
      this.context.stroke();
    } else if (this.state.tool === 'arrow' && x && y) {
      this.drawArrow(
        this.state.startX,
        this.state.startY,
        x,
        y,
        this.state.size
      );
    }

    this.actions.push({
      type: this.state.tool,
      color: this.state.color,
      size: this.state.size,
      data: {
        startX: this.state.startX,
        startY: this.state.startY,
        endX: x,
        endY: y,
      },
    });
  }

  /**
   * Draw arrow with arrowhead
   */
  private drawArrow(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    size: number
  ): void {
    if (!this.context) return;

    const headlen = size * 3;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    this.context.beginPath();
    this.context.moveTo(fromX, fromY);
    this.context.lineTo(toX, toY);
    this.context.stroke();

    // Draw arrowhead
    this.context.beginPath();
    this.context.moveTo(toX, toY);
    this.context.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    this.context.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    this.context.closePath();
    this.context.fillStyle = this.state.color;
    this.context.fill();
  }

  /**
   * Add text to canvas
   */
  private addText(x: number, y: number): void {
    if (!this.context) return;

    const text = prompt('Digite o texto:', '');
    if (!text) return;

    this.context.font = `${Math.max(12, this.state.size * 4)}px Arial`;
    this.context.fillStyle = this.state.color;
    this.context.fillText(text, x, y);
  }

  /**
   * Undo last action
   */
  undo(): void {
    if (this.actions.length === 0) return;

    this.actions.pop();
    this.redraw();
  }

  /**
   * Clear all drawings
   */
  clear(): void {
    this.actions = [];
    this.redraw();
  }

  /**
   * Redraw canvas with all actions
   */
  private redraw(): void {
    if (!this.canvas || !this.context || !this.originalImage) return;

    // Draw original image
    this.context.drawImage(this.originalImage, 0, 0);

    // Redraw all actions
    this.actions.forEach((action) => {
      this.context!.strokeStyle = action.color;
      this.context!.lineWidth = action.size;

      if (action.type === 'pencil') {
        // Pencil strokes would need to be replayed point-by-point
        // For now, we skip perfect reconstruction
      } else if (action.type === 'rect') {
        const width = action.data.endX - action.data.startX;
        const height = action.data.endY - action.data.startY;
        this.context!.strokeRect(
          action.data.startX,
          action.data.startY,
          width,
          height
        );
      } else if (action.type === 'circle') {
        const radius = Math.sqrt(
          Math.pow(action.data.endX - action.data.startX, 2) +
            Math.pow(action.data.endY - action.data.startY, 2)
        );
        this.context!.beginPath();
        this.context!.arc(
          action.data.startX,
          action.data.startY,
          radius,
          0,
          2 * Math.PI
        );
        this.context!.stroke();
      } else if (action.type === 'arrow') {
        this.drawArrow(
          action.data.startX,
          action.data.startY,
          action.data.endX,
          action.data.endY,
          action.size
        );
      }
    });
  }

  /**
   * Export edited image as data URL
   */
  exportImage(format: 'jpeg' | 'png' = 'jpeg'): string {
    if (!this.canvas) return '';

    if (format === 'jpeg') {
      return this.canvas.toDataURL('image/jpeg', 0.85);
    } else {
      return this.canvas.toDataURL('image/png');
    }
  }

  /**
   * Get action history count
   */
  getActionsCount(): number {
    return this.actions.length;
  }
}

// Export for use in app
(window as any).PhotoEditor = PhotoEditor;

export { PhotoEditor };
export type { DrawingState, DrawingAction };

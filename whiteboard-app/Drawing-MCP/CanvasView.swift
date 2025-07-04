//
//  CanvasView.swift
//  Drawing-MCP
//
//  Created by Kekai Apana on 4/13/25.
//

import SwiftUI

struct DrawingCanvas: UIViewRepresentable {
    @Binding var selectedColor: Color
    @Binding var isEraserActive: Bool
    @Binding var clearCanvas: Bool

    func makeUIView(context: Context) -> CanvasView {
        let view = CanvasView()
        view.currentColor = UIColor(selectedColor)
        view.isEraserActive = isEraserActive
        return view
    }

    func updateUIView(_ uiView: CanvasView, context: Context) {
        uiView.currentColor = UIColor(selectedColor)
        uiView.isEraserActive = isEraserActive

        if clearCanvas {
            uiView.clear()
            DispatchQueue.main.async {
                clearCanvas = false // Reset trigger
            }
        }
    }
    
    
}

class CanvasView: UIView {
    var lines: [Line] = []
    var currentLine: Line?
    var currentColor: UIColor = .black
    var isEraserActive = false

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear // <- Add this!
        isMultipleTouchEnabled = false
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let point = touches.first?.location(in: self) else { return }
        let colorToUse = isEraserActive ? UIColor.white : currentColor
        currentLine = Line(points: [point], color: colorToUse)
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let point = touches.first?.location(in: self), var current = currentLine else { return }
        current.points.append(point)
        currentLine = current
        lines.append(current)
        setNeedsDisplay()
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        if let current = currentLine {
            lines.append(current)
        }
        currentLine = nil
        setNeedsDisplay()
        screenCapture()
    }

    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext() else { return }

        // Draw all lines
        context.setLineCap(.round)
        context.setLineWidth(3)

        for line in lines {
            context.beginPath()
            if let firstPoint = line.points.first {
                context.move(to: firstPoint)
                for point in line.points.dropFirst() {
                    context.addLine(to: point)
                }
            }

            context.setStrokeColor(line.color.cgColor)
            context.strokePath()
        }

        // Draw current line in progress
        if let line = currentLine {
            context.beginPath()
            if let firstPoint = line.points.first {
                context.move(to: firstPoint)
                for point in line.points.dropFirst() {
                    context.addLine(to: point)
                }
            }

            context.setStrokeColor(line.color.cgColor)
            context.strokePath()
        }
    }
    
    func clear() {
        lines.removeAll()
        currentLine = nil
        setNeedsDisplay()
        screenCapture()
    }
    
    // MARK: - MCP Tool Integration
    func screenCapture() {
        print("Capturing...")
        let dataURL = self.exportAsDataURL()
        print("Uploading...")
        self.sendToServer(dataURL: dataURL!)
        print("Capture Sent")
    }

    func sendToServer(dataURL: String) {
        guard let url = URL(string: "https://screen-mcp.vercel.app/api/screenshots") else { return }
        
        // Get the current timestamp
        let timestamp = ISO8601DateFormatter().string(from: Date())

        // Prepare the request
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "screenshot": dataURL,
            "timestamp": timestamp,
            "url": "iPadWhiteboard",
            "userId": "kekai"
        ]
        
        // Convert the body dictionary to JSON data
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        // Perform the network request
        URLSession.shared.dataTask(with: request).resume()
    }
    
    func exportAsImage() -> UIImage? {
        let rendererFormat = UIGraphicsImageRendererFormat()
        rendererFormat.scale = 3.0
        let renderer = UIGraphicsImageRenderer(bounds: bounds, format: rendererFormat)
        return renderer.image { context in
            layer.render(in: context.cgContext)
        }
    }
    
    func exportAsDataURL() -> String? {
        guard let image = exportAsImage(),
              let imageData = image.pngData() else {
            print("Error: Failed to create image data")
            return nil
        }

        let base64String = imageData.base64EncodedString()
        let dataURLString = "data:image/png;base64,\(base64String)"
        return dataURLString
    }
    
}

struct Line {
    var points: [CGPoint]
    var color: UIColor
}


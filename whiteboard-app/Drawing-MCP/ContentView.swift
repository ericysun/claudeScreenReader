//
//  ContentView.swift
//  Drawing-MCP
//
//  Created by Kekai Apana on 4/13/25.
//

import SwiftUI
import Combine

struct ContentView: View {
    @State private var selectedColor: Color = .black
    @State private var isEraserActive: Bool = false
    @State private var clearCanvas = false
    @State private var showAlert = false
    @State private var alertMessage = ""


    var body: some View {
        VStack {
            Text("Whiteboard")
                .font(.title)
                .padding()

            // Drawing canvas with bindings
            DrawingCanvas(selectedColor: $selectedColor, isEraserActive: $isEraserActive, clearCanvas: $clearCanvas)
                .background(Color.white)
                .border(Color.gray, width: 1)
                .padding()

            // Tools
            HStack {
                ColorPicker("Pick Color", selection: $selectedColor)
                    .labelsHidden()

                Button(action: {
                    isEraserActive.toggle()
                }) {
                    Image(systemName: isEraserActive ? "eraser.fill" : "eraser")
                        .font(.title2)
                        .foregroundColor(isEraserActive ? .blue : .primary)
                }

                Button(action: {
                    clearCanvas.toggle()
                }) {
                    Image(systemName: "trash")
                        .font(.title2)
                        .foregroundColor(.red)
                }
            }
            .padding()

            Spacer()
        }
        .background(Color(white: 0.95))
        .alert(isPresented: $showAlert) {
            Alert(title: Text("Notice"), message: Text(alertMessage), dismissButton: .default(Text("OK")))
        }
    }

}

#Preview {
    ContentView()
}

#!/usr/bin/swift
import AppKit
import Foundation
import Vision

guard CommandLine.arguments.count > 1 else {
  fputs("usage: mac-vision-ocr.swift <image-path>\n", stderr)
  exit(1)
}

let path = CommandLine.arguments[1]
let url = URL(fileURLWithPath: path)
guard let image = NSImage(contentsOf: url),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil)
else {
  fputs("failed to load image: \(path)\n", stderr)
  exit(2)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.recognitionLanguages = ["ru-RU", "en-US"]
request.usesLanguageCorrection = true

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
  try handler.perform([request])
} catch {
  fputs("vision error: \(error)\n", stderr)
  exit(3)
}

guard let observations = request.results else { exit(0) }

for observation in observations {
  guard let candidate = observation.topCandidates(1).first else { continue }
  print(candidate.string)
}

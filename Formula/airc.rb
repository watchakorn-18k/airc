class Airc < Formula
  desc "AI-powered terminal code reviewer with severity scoring, TUI dashboard, and CI/CD integration"
  homepage "https://github.com/watchakorn-18k/airc"
  url "https://github.com/watchakorn-18k/airc/archive/refs/tags/v1.1.0.tar.gz"
  sha256 "5a76bc6ab0aec8a932fc47a6d0a0a5ee6d8531a5dbd3eb5b60b8f4a0a18688a2"
  license "MIT"

  depends_on "node" => :build

  def install
    system "npm", "ci"
    system "npm", "run", "build"
    bin.install "dist/index.js" => "airc"
  end

  test do
    assert_match "AI-powered terminal code reviewer", shell_output("#{bin}/airc --help")
  end
end

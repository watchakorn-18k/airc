class Airc < Formula
  desc "AI-powered terminal code reviewer with severity scoring, TUI dashboard, and CI/CD integration"
  homepage "https://github.com/watchakorn-b/airc"
  url "https://github.com/watchakorn-b/airc/archive/refs/tags/v1.1.0.tar.gz"
  sha256 "PLACEHOLDER_SHA256"
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

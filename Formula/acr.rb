class Acr < Formula
  desc "Terminal-based AI code reviewer with real-time feedback"
  homepage "https://github.com/watchakorn-b/acr"
  url "https://github.com/watchakorn-b/acr/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  depends_on "node" => :build

  def install
    system "npm", "ci"
    system "npm", "run", "build"
    bin.install "dist/index.js" => "acr"
  end

  test do
    assert_match "AI-powered code reviewer", shell_output("#{bin}/acr --help")
  end
end

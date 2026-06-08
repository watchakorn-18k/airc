class AiCodeArc < Formula
  include Language::C::Gem

  desc "AI-powered terminal code reviewer with severity scoring, TUI dashboard, and CI/CD integration"
  homepage "https://github.com/watchakorn-18k/airc"
  url "https://registry.npmjs.org/airc/-/airc-1.1.0.tgz"
  sha256 "c8d3eae160a892e32837db3dcae515e843e5383fef52b8141940c8bcf8b6d59f"
  license "MIT"

  depends_on "node" => :build

  def install
    # npm install to libexec, then symlink bin
    libexec.install Dir["*"]
    bin.write_exec_script libexec/"dist/index.js"
  end

  test do
    assert_match "AI-powered terminal code reviewer", shell_output("#{bin}/airc --help")
  end
end

// Automated Test Script for Markdown Format Transformation
// Run this in the browser console to test markdown transformation

const testSuite = {
  // Test data for markdown scenarios
  testCases: {
    plainText: {
      input: `GitHub Security Reminder

The first step is GitHub, and we need to ensure that we don't commit our ChatGPT API key to the repository.

Non-Negotiables:
- ChatGPT API Integration - Core to app functionality
- EnhancedTextRenderer.swift - Rendering/text pipeline must remain untouched
- Core UI/UX - The app's look and feel should stay consistent`,
      
      expectedMarkdown: {
        contains: ['# ', '**', '## ', '- '],
        format: 'markdown'
      }
    },
    
    codeBlock: {
      input: `API Documentation

Here's how to use our API:

const api = new ClarityAPI({
  key: process.env.API_KEY
});

const result = await api.transform({
  content: "Hello world",
  format: "markdown"
});`,
      
      expectedMarkdown: {
        contains: ['```javascript', '```', '# API Documentation']
      }
    }
  },

  // Helper function to simulate user actions
  async simulateTransformation(content, format) {
    console.log(`\n🧪 Testing ${format} transformation...`);
    
    // Set content in editor
    const editor = document.querySelector('.ProseMirror');
    if (!editor) {
      console.error('❌ Editor not found');
      return false;
    }
    
    // Clear editor and set new content
    editor.innerHTML = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
    
    // Trigger content change event
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Wait for content to be processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Click AI Edit button
    const aiEditButton = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('AI Edit'));
    
    if (!aiEditButton) {
      console.error('❌ AI Edit button not found');
      return false;
    }
    
    aiEditButton.click();
    
    // Wait for menu to open
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find and click the format preset
    const formatButton = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes(format));
    
    if (!formatButton) {
      console.error(`❌ ${format} button not found`);
      return false;
    }
    
    console.log(`✅ Clicking ${format} button...`);
    formatButton.click();
    
    // Wait for transformation to complete
    console.log('⏳ Waiting for transformation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return true;
  },

  // Verify content window shows raw format
  verifyContentWindow(expectedFormat, expectedContains = []) {
    console.log('\n📋 Verifying content window...');
    
    const editor = document.querySelector('.ProseMirror');
    if (!editor) {
      console.error('❌ Editor not found');
      return false;
    }
    
    const content = editor.textContent || '';
    console.log('Content preview:', content.substring(0, 100) + '...');
    
    let passed = true;
    
    // Check for expected content
    for (const expected of expectedContains) {
      if (!content.includes(expected)) {
        console.error(`❌ Content window missing expected: "${expected}"`);
        passed = false;
      } else {
        console.log(`✅ Found expected: "${expected}"`);
      }
    }
    
    return passed;
  },

  // Verify preview window renders correctly
  verifyPreviewWindow() {
    console.log('\n👁️ Verifying preview window...');
    
    const preview = document.querySelector('[class*="ContentPreview"]');
    if (!preview) {
      console.error('❌ Preview window not found');
      return false;
    }
    
    const previewContent = preview.querySelector('[dangerouslySetInnerHTML]');
    if (!previewContent) {
      console.error('❌ Preview content not found');
      return false;
    }
    
    // Check if preview is visible
    const isVisible = preview.offsetParent !== null;
    if (!isVisible) {
      console.error('❌ Preview window is not visible');
      return false;
    }
    
    console.log('✅ Preview window is visible and contains content');
    
    // Check for rendered HTML elements
    const hasRenderedElements = previewContent.querySelector('h1, h2, p, ul, ol, pre');
    if (hasRenderedElements) {
      console.log('✅ Preview contains rendered HTML elements');
    } else {
      console.log('⚠️ Preview may not be rendering correctly');
    }
    
    return true;
  },

  // Verify format badge
  verifyFormatBadge(expectedFormat) {
    console.log('\n🏷️ Verifying format badge...');
    
    const formatBadge = document.querySelector('[class*="FormatBadge"]');
    if (!formatBadge) {
      console.error('❌ Format badge not found');
      return false;
    }
    
    const badgeText = formatBadge.textContent || '';
    console.log(`Format badge shows: "${badgeText}"`);
    
    if (badgeText.includes('Markdown')) {
      console.log(`✅ Format badge correctly shows Markdown`);
      return true;
    } else {
      console.error(`❌ Format badge should show Markdown`);
      return false;
    }
  },

  // Check console logs
  checkConsoleLogs() {
    console.log('\n📊 Checking console logs...');
    console.log('Look for these log patterns:');
    console.log('- 🎯 [RichTextEditor] AI transformation received');
    console.log('- 📝 [RichTextEditor] Updating content for markdown transformation');
    console.log('- ✅ [RichTextEditor] Content updated in editor');
    console.log('- 🎨 [ContentPreview] Rendering content as format');
    console.log('- ✅ [ContentPreview] Successfully rendered');
  },

  // Run markdown tests
  async runMarkdownTests() {
    console.log('🚀 Starting Markdown Transformation Test Suite');
    console.log('==========================================\n');
    
    const results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    
    // Test 1: Plain Text to Markdown
    console.log('\n📝 TEST 1: Plain Text → Beautiful Markdown Format');
    console.log('================================================');
    
    if (await this.simulateTransformation(this.testCases.plainText.input, 'Beautiful Markdown Format')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const contentPassed = this.verifyContentWindow(
        'markdown',
        this.testCases.plainText.expectedMarkdown.contains
      );
      const previewPassed = this.verifyPreviewWindow();
      const badgePassed = this.verifyFormatBadge('markdown');
      
      if (contentPassed && previewPassed && badgePassed) {
        console.log('\n✅ TEST 1 PASSED');
        results.passed++;
      } else {
        console.log('\n❌ TEST 1 FAILED');
        results.failed++;
      }
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Code Block Markdown
    console.log('\n\n📝 TEST 2: Technical Content → Beautiful Markdown Format');
    console.log('======================================================');
    
    if (await this.simulateTransformation(this.testCases.codeBlock.input, 'Beautiful Markdown Format')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const contentPassed = this.verifyContentWindow(
        'markdown',
        this.testCases.codeBlock.expectedMarkdown.contains
      );
      const previewPassed = this.verifyPreviewWindow();
      const badgePassed = this.verifyFormatBadge('markdown');
      
      if (contentPassed && previewPassed && badgePassed) {
        console.log('\n✅ TEST 2 PASSED');
        results.passed++;
      } else {
        console.log('\n❌ TEST 2 FAILED');
        results.failed++;
      }
    }
    
    // Final summary
    console.log('\n\n📊 TEST SUITE SUMMARY');
    console.log('====================');
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The markdown transformation system is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the implementation.');
    }
    
    this.checkConsoleLogs();
    
    return results;
  }
};

// Run the test suite
console.log('To run the markdown test suite, execute: testSuite.runMarkdownTests()');
console.log('Make sure you have the Clarity app open and an API key configured.');

// Make it available globally
window.markdownTests = testSuite; 
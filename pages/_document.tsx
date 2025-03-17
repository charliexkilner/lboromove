import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from 'next/document';
import React from 'react';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          {/* Add Mapbox GL JS script and CSS - Use CDN without async for better reliability */}
          <link 
            href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css" 
            rel="stylesheet" 
          />
          <script 
            src="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"
          ></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;

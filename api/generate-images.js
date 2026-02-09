// api/generate-images.js
// 这个 API 接收用户的故事文字，生成 2 张插图

export default async function handler(req, res) {
    // 只接受 POST 请求
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      // 获取用户发来的故事文字
      const { text } = req.body;
  
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
  
      // 统一画风的 prompt（水彩风格）
      const stylePrompt = `
        Simple illustration style, Bright and vibrant colors.
        The characters' skin tone and features are similar to those of East Asians, hand-painted texture.
        Color palette: soft pink, cream, light blue, pale yellow.
        Minimal detail, focus on emotion and mood.
        Soft edges, gentle brushstrokes.
      `;
  
      // 完整的 prompt = 画风 + 用户故事
      const fullPrompt = `${stylePrompt}\n\nScene: ${text}`;
  
      // 调用 Replicate API 生成图片
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
          input: {
            prompt: fullPrompt,
            num_outputs: 2,
            width: 1024,
            height: 1024,
          }
        })
      });
  
      const prediction = await response.json();
  
      // 等待图片生成
      let result = prediction;
      
      for (let i = 0; i < 60; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
  
        const statusResponse = await fetch(
          `https://api.replicate.com/v1/predictions/${prediction.id}`,
          {
            headers: {
              'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
            }
          }
        );
  
        result = await statusResponse.json();
  
        if (result.status === 'succeeded' || result.status === 'failed') {
          break;
        }
      }
  
      if (result.status === 'failed') {
        return res.status(500).json({ error: 'Image generation failed' });
      }
  
      if (!result.output || result.output.length === 0) {
        return res.status(500).json({ error: 'No images generated' });
      }
  
      return res.status(200).json({
        success: true,
        images: result.output
      });
  
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
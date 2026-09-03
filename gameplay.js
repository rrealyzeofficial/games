(() => {
  'use strict';

  const $ = id => document.getElementById(id);


  // Keep gameplay on the same 1440px PC canvas on mobile.
  function applyMobileDesktopScale() {
    if (!window.matchMedia('(max-width: 900px)').matches) {
      document.body.classList.remove('realyze-mobile-pc');
      return;
    }
    const sw = Math.max(1, Number(window.screen?.width || window.innerWidth));
    const sh = Math.max(1, Number(window.screen?.height || window.innerHeight));
    const landscapeWidth = Math.max(sw, sh);
    const scale = Math.min((landscapeWidth / 1440) * 0.88, 1);
    document.body.classList.add('realyze-mobile-pc');
    document.body.style.setProperty('--realyze-mobile-scale', String(scale));
  }
  window.addEventListener('resize', applyMobileDesktopScale, {passive:true});
  window.addEventListener('orientationchange', () => setTimeout(applyMobileDesktopScale, 80), {passive:true});
  applyMobileDesktopScale();
  const params = new URLSearchParams(location.search);
  const songIndex = Number(params.get('song') || 0);
  const difficulty = params.get('difficulty') || 'EASY';
  const character = params.get('character') || 'mystery';

  const songs = [
    { id:'track-01', name:'VIRTUAL TO LIVE', artist:'REALYZE (but Ebi & Mikon)', audio:'assets/song-01_[cut_98sec].mp3' },
    { id:'track-02', name:'BOUNCE', artist:'VANI', audio:'assets/song-022_[cut_133sec].mp3' },
    { id:'track-03', name:'AFTER THE RAIN', artist:'REALYZE!!', audio:'' }
  ];

  const song = songs[songIndex] || songs[0];
  const laneArea = $('laneArea');
  const audio = song.audio ? new Audio(song.audio) : null;

  const keys = { d:0, f:1, j:2, k:3 };
  const travel = 1.8;
  const hitWindow = .28;
  const perfectWindow = .10;
  const greatWindow = .18;

  const chart = [
    [1.2693, 0, 'tap', 0],
    [1.664, 1, 'tap', 0],
    [2.0586, 2, 'tap', 0],
    [2.4533, 3, 'tap', 0],
    [2.848, 2, 'tap', 0],
    [3.6373, 3, 'tap', 0],
    [4.032, 0, 'tap', 0],
    [4.4266, 1, 'tap', 0],
    [4.4266, 3, 'tap', 0],
    [4.8213, 3, 'tap', 0],
    [5.216, 2, 'tap', 0],
    [5.4133, 0, 'tap', 0],
    [6.0053, 3, 'tap', 0],
    [6.4, 1, 'tap', 0],
    [6.5973, 3, 'tap', 0],
    [6.7946, 0, 'tap', 0],
    [6.7946, 2, 'tap', 0],
    [6.992, 1, 'tap', 0],
    [7.1893, 0, 'tap', 0],
    [7.584, 0, 'tap', 0],
    [7.7813, 2, 'tap', 0],
    [8.3733, 2, 'tap', 0],
    [8.768, 3, 'tap', 0],
    [8.9653, 1, 'tap', 0],
    [9.1626, 0, 'tap', 0],
    [9.1626, 2, 'tap', 0],
    [9.5573, 1, 'tap', 0],
    [9.7546, 2, 'tap', 0],
    [9.952, 3, 'tap', 0],
    [10.1493, 1, 'tap', 0],
    [10.7413, 1, 'tap', 0],
    [11.136, 3, 'tap', 0],
    [11.3333, 1, 'tap', 0],
    [11.5306, 0, 'tap', 0],
    [11.5306, 2, 'tap', 0],
    [11.9253, 0, 'tap', 0],
    [12.32, 3, 'hold', 0.45],
    [12.5173, 1, 'tap', 0],
    [13.1093, 2, 'tap', 0],
    [13.504, 0, 'tap', 0],
    [13.7013, 2, 'tap', 0],
    [13.8986, 0, 'tap', 0],
    [13.8986, 2, 'tap', 0],
    [14.2933, 1, 'tap', 0],
    [14.688, 2, 'tap', 0],
    [14.8853, 0, 'tap', 0],
    [15.28, 2, 'tap', 0],
    [15.4773, 2, 'tap', 0],
    [15.872, 1, 'tap', 0],
    [16.0693, 3, 'tap', 0],
    [16.2666, 1, 'tap', 0],
    [16.2666, 3, 'tap', 0],
    [16.6613, 0, 'tap', 0],
    [17.056, 1, 'tap', 0],
    [17.2533, 3, 'tap', 0],
    [17.4506, 3, 'tap', 0],
    [17.8453, 2, 'tap', 0],
    [18.0426, 3, 'tap', 0],
    [18.24, 0, 'tap', 0],
    [18.4373, 2, 'tap', 0],
    [18.6346, 1, 'tap', 0],
    [18.6346, 3, 'tap', 0],
    [19.0293, 1, 'tap', 0],
    [19.424, 2, 'tap', 0],
    [19.6213, 0, 'tap', 0],
    [20.2133, 0, 'tap', 0],
    [20.608, 1, 'tap', 0],
    [20.8053, 3, 'tap', 0],
    [21.0026, 0, 'tap', 0],
    [21.0026, 2, 'tap', 0],
    [21.3973, 3, 'tap', 0],
    [21.792, 2, 'tap', 0],
    [21.9893, 0, 'tap', 0],
    [22.5813, 3, 'tap', 0],
    [22.976, 0, 'tap', 0],
    [23.1733, 2, 'tap', 0],
    [23.3706, 1, 'tap', 0],
    [23.3706, 3, 'tap', 0],
    [23.568, 0, 'tap', 0],
    [23.7653, 3, 'tap', 0],
    [24.16, 2, 'tap', 0],
    [24.3573, 0, 'tap', 0],
    [24.9493, 3, 'hold', 0.45],
    [25.344, 1, 'tap', 0],
    [25.5413, 3, 'tap', 0],
    [25.7386, 0, 'tap', 0],
    [25.7386, 2, 'tap', 0],
    [26.1333, 0, 'tap', 0],
    [26.3306, 1, 'tap', 0],
    [26.528, 0, 'tap', 0],
    [26.7253, 2, 'tap', 0],
    [27.3173, 2, 'tap', 0],
    [27.712, 3, 'tap', 0],
    [27.9093, 1, 'tap', 0],
    [28.1066, 0, 'tap', 0],
    [28.1066, 2, 'tap', 0],
    [28.5013, 1, 'tap', 0],
    [28.896, 3, 'tap', 0],
    [29.0933, 1, 'tap', 0],
    [29.6853, 1, 'tap', 0],
    [30.08, 3, 'tap', 0],
    [30.2773, 1, 'tap', 0],
    [30.4746, 0, 'tap', 0],
    [30.4746, 2, 'tap', 0],
    [30.8693, 0, 'tap', 0],
    [31.264, 3, 'tap', 0],
    [31.4613, 1, 'tap', 0],
    [31.856, 0, 'tap', 0],
    [32.0533, 2, 'tap', 0],
    [32.448, 0, 'tap', 0],
    [32.6453, 2, 'tap', 0],
    [32.8426, 0, 'tap', 0],
    [32.8426, 2, 'tap', 0],
    [33.2373, 1, 'tap', 0],
    [33.632, 2, 'tap', 0],
    [33.8293, 0, 'tap', 0],
    [34.4213, 2, 'tap', 0],
    [34.6186, 3, 'tap', 0],
    [34.816, 1, 'tap', 0],
    [35.0133, 3, 'tap', 0],
    [35.2106, 1, 'tap', 0],
    [35.2106, 3, 'tap', 0],
    [35.6053, 0, 'tap', 0],
    [36.0, 1, 'tap', 0],
    [36.1973, 3, 'tap', 0],
    [36.3946, 3, 'tap', 0],
    [36.7893, 2, 'tap', 0],
    [37.184, 0, 'tap', 0],
    [37.3813, 2, 'tap', 0],
    [37.5786, 1, 'tap', 0],
    [37.5786, 3, 'hold', 0.45],
    [37.9733, 1, 'tap', 0],
    [38.1706, 2, 'tap', 0],
    [38.368, 2, 'tap', 0],
    [38.5653, 0, 'tap', 0],
    [39.1573, 0, 'tap', 0],
    [39.552, 1, 'tap', 0],
    [39.7493, 3, 'tap', 0],
    [39.9466, 0, 'tap', 0],
    [39.9466, 2, 'tap', 0],
    [40.144, 1, 'tap', 0],
    [40.3413, 3, 'tap', 0],
    [40.736, 2, 'tap', 0],
    [40.9333, 0, 'tap', 0],
    [41.328, 0, 'tap', 0],
    [41.5253, 3, 'tap', 0],
    [41.92, 0, 'tap', 0],
    [42.1173, 2, 'tap', 0],
    [42.3146, 1, 'tap', 0],
    [42.3146, 3, 'tap', 0],
    [42.7093, 3, 'tap', 0],
    [42.9066, 0, 'tap', 0],
    [43.104, 2, 'tap', 0],
    [43.3013, 0, 'tap', 0],
    [43.8933, 3, 'tap', 0],
    [44.288, 1, 'tap', 0],
    [44.4853, 3, 'tap', 0],
    [44.6826, 0, 'tap', 0],
    [44.6826, 2, 'tap', 0],
    [45.0773, 0, 'tap', 0],
    [45.472, 0, 'tap', 0],
    [45.6693, 2, 'tap', 0],
    [46.2613, 2, 'tap', 0],
    [46.656, 3, 'tap', 0],
    [46.8533, 1, 'tap', 0],
    [47.0506, 0, 'tap', 0],
    [47.0506, 2, 'tap', 0],
    [47.4453, 1, 'tap', 0],
    [47.6426, 2, 'tap', 0],
    [47.84, 3, 'tap', 0],
    [48.0373, 1, 'tap', 0],
    [48.432, 3, 'tap', 0],
    [48.6293, 1, 'tap', 0],
    [49.024, 3, 'tap', 0],
    [49.2213, 1, 'tap', 0],
    [49.4186, 0, 'tap', 0],
    [49.4186, 2, 'tap', 0],
    [49.8133, 0, 'tap', 0],
    [50.208, 3, 'hold', 0.45],
    [50.4053, 1, 'tap', 0],
    [50.8, 0, 'tap', 0],
    [50.9973, 2, 'tap', 0],
    [51.1946, 3, 'tap', 0],
    [51.392, 0, 'tap', 0],
    [51.5893, 2, 'tap', 0],
    [51.7866, 0, 'tap', 0],
    [51.7866, 2, 'tap', 0],
    [52.1813, 1, 'tap', 0],
    [52.576, 2, 'tap', 0],
    [52.7733, 0, 'tap', 0],
    [52.9706, 3, 'tap', 0],
    [53.3653, 2, 'tap', 0],
    [53.76, 1, 'tap', 0],
    [53.9573, 3, 'tap', 0],
    [54.1546, 1, 'tap', 0],
    [54.1546, 3, 'tap', 0],
    [54.5493, 0, 'tap', 0],
    [54.944, 1, 'tap', 0],
    [55.1413, 3, 'tap', 0],
    [55.7333, 2, 'tap', 0],
    [56.128, 0, 'tap', 0],
    [56.3253, 2, 'tap', 0],
    [56.5226, 1, 'tap', 0],
    [56.5226, 3, 'tap', 0],
    [56.72, 2, 'tap', 0],
    [56.9173, 1, 'tap', 0],
    [57.1146, 2, 'tap', 0],
    [57.312, 2, 'tap', 0],
    [57.5093, 0, 'tap', 0],
    [58.1013, 0, 'tap', 0],
    [58.496, 1, 'tap', 0],
    [58.6933, 3, 'tap', 0],
    [58.8906, 0, 'tap', 0],
    [58.8906, 2, 'tap', 0],
    [59.2853, 3, 'tap', 0],
    [59.4826, 0, 'tap', 0],
    [59.68, 2, 'tap', 0],
    [59.8773, 0, 'tap', 0],
    [60.272, 0, 'tap', 0],
    [60.4693, 3, 'tap', 0],
    [60.864, 0, 'tap', 0],
    [61.0613, 2, 'tap', 0],
    [61.2586, 1, 'tap', 0],
    [61.2586, 3, 'tap', 0],
    [61.6533, 3, 'tap', 0],
    [62.048, 2, 'tap', 0],
    [62.2453, 0, 'tap', 0],
    [62.8373, 3, 'hold', 0.45],
    [63.232, 1, 'tap', 0],
    [63.4293, 3, 'tap', 0],
    [63.6266, 0, 'tap', 0],
    [63.6266, 2, 'tap', 0],
    [64.0213, 0, 'tap', 0],
    [64.416, 0, 'tap', 0],
    [64.6133, 2, 'tap', 0],
    [64.8106, 1, 'tap', 0],
    [65.008, 0, 'tap', 0],
    [65.2053, 2, 'tap', 0],
    [65.6, 3, 'tap', 0],
    [65.7973, 1, 'tap', 0],
    [65.9946, 0, 'tap', 0],
    [65.9946, 2, 'tap', 0],
    [66.3893, 1, 'tap', 0],
    [66.5866, 2, 'tap', 0],
    [66.784, 3, 'tap', 0],
    [66.9813, 1, 'tap', 0],
    [67.5733, 1, 'tap', 0],
    [67.7706, 2, 'tap', 0],
    [67.968, 3, 'tap', 0],
    [68.1653, 1, 'tap', 0],
    [68.3626, 0, 'tap', 0],
    [68.3626, 2, 'tap', 0],
    [68.7573, 0, 'tap', 0],
    [69.152, 3, 'tap', 0],
    [69.3493, 1, 'tap', 0],
    [69.744, 0, 'tap', 0],
    [69.9413, 2, 'tap', 0],
    [70.336, 0, 'tap', 0],
    [70.5333, 2, 'tap', 0],
    [70.7306, 0, 'tap', 0],
    [70.7306, 2, 'tap', 0],
    [71.1253, 1, 'tap', 0],
    [71.52, 2, 'tap', 0],
    [71.7173, 0, 'tap', 0],
    [72.3093, 2, 'tap', 0],
    [72.704, 1, 'tap', 0],
    [72.9013, 3, 'tap', 0],
    [73.0986, 1, 'tap', 0],
    [73.0986, 3, 'tap', 0],
    [73.296, 2, 'tap', 0],
    [73.4933, 0, 'tap', 0],
    [73.888, 1, 'tap', 0],
    [74.0853, 3, 'tap', 0],
    [74.6773, 2, 'tap', 0],
    [75.072, 0, 'tap', 0],
    [75.2693, 2, 'tap', 0],
    [75.4666, 1, 'tap', 0],
    [75.4666, 3, 'tap', 0],
    [75.8613, 1, 'tap', 0],
    [76.0586, 2, 'tap', 0],
    [76.256, 2, 'tap', 0],
    [76.4533, 0, 'tap', 0],
    [76.6506, 0, 'tap', 0],
    [77.0453, 0, 'tap', 0],
    [77.44, 1, 'tap', 0],
    [77.6373, 3, 'tap', 0],
    [77.8346, 0, 'tap', 0],
    [77.8346, 2, 'tap', 0],
    [78.2293, 3, 'tap', 0],
    [78.624, 2, 'tap', 0],
    [78.8213, 0, 'tap', 0],
    [79.216, 0, 'tap', 0],
    [79.4133, 3, 'tap', 0],
    [79.808, 0, 'tap', 0],
    [80.0053, 2, 'tap', 0],
    [80.2026, 1, 'tap', 0],
    [80.2026, 3, 'tap', 0],
    [80.5973, 3, 'tap', 0],
    [80.992, 2, 'tap', 0],
    [81.1893, 0, 'tap', 0],
    [81.584, 3, 'tap', 0],
    [81.7813, 3, 'tap', 0],
    [82.176, 1, 'tap', 0],
    [82.3733, 3, 'tap', 0],
    [82.5706, 0, 'tap', 0],
    [82.5706, 2, 'tap', 0],
    [82.9653, 0, 'tap', 0],
    [83.36, 0, 'tap', 0],
    [83.5573, 2, 'tap', 0],
    [84.1493, 2, 'tap', 0],
    [84.3466, 3, 'tap', 0],
    [84.544, 3, 'tap', 0],
    [84.7413, 1, 'tap', 0],
    [84.9386, 0, 'tap', 0],
    [84.9386, 2, 'tap', 0],
    [85.3333, 1, 'tap', 0],
    [85.5306, 2, 'tap', 0],
    [85.728, 3, 'tap', 0],
    [85.9253, 1, 'tap', 0],
    [86.5173, 1, 'tap', 0],
    [86.912, 3, 'tap', 0],
    [87.1093, 1, 'tap', 0],
    [87.3066, 0, 'tap', 0],
    [87.3066, 2, 'tap', 0],
    [87.7013, 0, 'tap', 0],
    [88.096, 3, 'hold', 0.45],
    [88.8853, 2, 'tap', 0],
    [89.28, 0, 'tap', 0],
    [89.6746, 0, 'tap', 0],
    [89.6746, 2, 'tap', 0],
    [90.0693, 1, 'tap', 0],
    [90.464, 2, 'tap', 0],
    [90.8586, 3, 'tap', 0],
    [91.2533, 2, 'tap', 0],
    [91.648, 1, 'tap', 0],
    [92.0426, 1, 'tap', 0],
    [92.0426, 3, 'tap', 0],
    [92.4373, 0, 'tap', 0],
    [92.832, 1, 'tap', 0],
    [93.6213, 2, 'tap', 0],
    [94.016, 0, 'tap', 0],
    [94.4106, 1, 'tap', 0],
    [94.4106, 3, 'tap', 0],
    [94.8053, 1, 'tap', 0],
    [95.2, 2, 'tap', 0],
    [95.9893, 0, 'tap', 0],
    [96.384, 1, 'tap', 0],
    [96.7787, 0, 'tap', 0],
    [96.7787, 2, 'tap', 0],
    [97.1733, 3, 'tap', 0],
    [97.568, 2, 'tap', 0],
    [98.3573, 3, 'tap', 0],
    [98.752, 0, 'tap', 0],
    [99.1467, 1, 'tap', 0],
    [99.1467, 3, 'tap', 0],
    [99.5413, 3, 'tap', 0],
    [99.936, 2, 'tap', 0],
    [100.7253, 3, 'hold', 0.45],
    [101.12, 1, 'tap', 0],
    [101.5147, 0, 'tap', 0],
    [101.5147, 2, 'tap', 0],
    [101.9093, 0, 'tap', 0],
    [102.304, 0, 'tap', 0],
    [103.0933, 2, 'tap', 0],
    [103.488, 3, 'tap', 0],
    [103.8827, 0, 'tap', 0],
    [103.8827, 2, 'tap', 0],
    [104.2773, 1, 'tap', 0],
    [104.672, 3, 'tap', 0],
    [105.0667, 0, 'tap', 0],
    [105.4613, 1, 'tap', 0],
    [105.856, 3, 'tap', 0],
    [106.2507, 0, 'tap', 0],
    [106.2507, 2, 'tap', 0],
    [106.6453, 0, 'tap', 0],
    [107.04, 3, 'tap', 0],
    [107.8293, 2, 'tap', 0],
    [108.224, 0, 'tap', 0],
    [108.6187, 0, 'tap', 0],
    [108.6187, 2, 'tap', 0],
    [109.0133, 1, 'tap', 0],
    [109.408, 2, 'tap', 0],
    [110.1973, 2, 'tap', 0],
    [110.592, 1, 'tap', 0],
    [110.9867, 1, 'tap', 0],
    [110.9867, 3, 'tap', 0],
    [111.3813, 0, 'tap', 0],
    [111.776, 1, 'tap', 0],
    [112.5653, 2, 'tap', 0],
    [112.96, 0, 'tap', 0],
    [113.3547, 1, 'tap', 0],
    [113.3547, 3, 'tap', 0],
    [113.7493, 1, 'tap', 0],
    [114.144, 2, 'tap', 0],
    [114.9333, 0, 'tap', 0],
    [115.328, 1, 'tap', 0],
    [115.7227, 0, 'tap', 0],
    [115.7227, 2, 'tap', 0],
    [116.1173, 3, 'tap', 0],
    [116.512, 2, 'tap', 0],
    [116.9067, 1, 'tap', 0],
    [117.3013, 3, 'tap', 0],
    [117.696, 0, 'tap', 0],
    [118.0907, 1, 'tap', 0],
    [118.0907, 3, 'tap', 0],
    [118.4853, 3, 'tap', 0],
    [118.88, 2, 'tap', 0],
    [119.6693, 3, 'hold', 0.45],
    [120.064, 1, 'tap', 0],
    [120.4587, 0, 'tap', 0],
    [120.4587, 2, 'tap', 0],
    [120.8533, 0, 'tap', 0],
    [121.248, 0, 'tap', 0],
    [122.0373, 2, 'tap', 0],
    [122.432, 3, 'tap', 0],
    [122.8267, 0, 'tap', 0],
    [122.8267, 2, 'tap', 0],
    [123.2213, 1, 'tap', 0],
    [123.616, 3, 'tap', 0],
    [124.4053, 1, 'tap', 0],
    [124.8, 3, 'tap', 0],
    [125.1947, 0, 'tap', 0],
    [125.1947, 2, 'tap', 0],
    [125.5893, 0, 'tap', 0],
    [125.984, 3, 'tap', 0],
    [126.7733, 2, 'tap', 0],
    [127.168, 0, 'tap', 0],
    [127.5627, 0, 'tap', 0],
    [127.9573, 1, 'tap', 0],
    [128.352, 2, 'tap', 0],
    [129.1413, 2, 'tap', 0],
    [129.536, 1, 'tap', 0],
    [129.9307, 3, 'tap', 0],
    [130.3253, 0, 'tap', 0],
    [130.72, 1, 'tap', 0],
    [131.1147, 3, 'tap', 0],
  ];

  const notes = chart.map((n,i) => ({id:i,time:n[0],lane:n[1],type:n[2],duration:n[3],el:null,hit:false,missed:false}));
  let frame = 0, running = false, score = 0, combo = 0, maxCombo = 0;
  let perfect = 0, great = 0, okay = 0, miss = 0;
  let skillReady = true, skillActive = false, skillNextAt = 0;

  $('songName').textContent = song.name;
  $('difficulty').textContent = difficulty;
  document.title = `REALYZE!! — ${song.name}`;

  function hud() {
    $('score').textContent = score.toLocaleString();
    $('comboNumber').textContent = combo;
    $('scoreFill').style.width = `${Math.min(100, score / (notes.length * 10))}%`;
  }

  function updateSkill(t) {
    const btn = $('skillBtn');
    const timer = $('skillTimer');
    if (!btn || !timer) return;

    if (skillActive) {
      btn.classList.add('active');
      btn.classList.remove('ready');
      timer.textContent = 'ACTIVE';
      return;
    }

    btn.classList.remove('active');
    if (skillReady) {
      btn.classList.add('ready');
      timer.textContent = 'READY';
    } else {
      btn.classList.remove('ready');
      timer.textContent = `${Math.max(0, Math.ceil(skillNextAt - t))}s`;
      if (t >= skillNextAt) {
        skillReady = true;
        btn.classList.add('ready');
        timer.textContent = 'READY';
      }
    }
  }

  function judge(text) {
    const el = $('judgement');
    el.textContent = text;
    el.classList.remove('pop');
    void el.offsetWidth;
    if (text) el.classList.add('pop');
  }

  function createNote(note) {
    const el = document.createElement('div');
    el.className = `note ${note.type === 'hold' ? 'hold' : ''}`;
    el.style.left = `${note.lane * 25 + 12.5}%`;
    if (note.type === 'hold') el.style.setProperty('--hold-height', `${30 + note.duration * 150}px`);
    laneArea.appendChild(el);
    note.el = el;
  }

  function removeNote(note, animate=false) {
    if (!note.el) return;
    const el = note.el;
    note.el = null;
    if (animate) {
      el.classList.add('hit');
      setTimeout(() => el.remove(), 180);
    } else el.remove();
  }

  function loop() {
    if (!running || !audio) return;
    const t = audio.currentTime;
    updateSkill(t);
    const hitY = laneArea.clientHeight - 82;

    for (const note of notes) {
      if (!note.el && !note.hit && !note.missed && t >= note.time - travel) createNote(note);
      if (!note.el || note.hit || note.missed) continue;
      const diff = note.time - t;
      const progress = 1 - diff / travel;
      const y = -40 + (hitY + 40) * progress;
      note.el.style.transform = `translate(-50%, ${y}px)`;
      if (diff < -hitWindow) {
        note.missed = true;
        combo = 0;
        miss++;
        removeNote(note);
        judge('MISS');
        hud();
      }
    }

    frame = requestAnimationFrame(loop);
  }

  function hit(lane) {
    if (!running || !audio) return;
    const t = audio.currentTime;
    let target = null, closest = Infinity;

    for (const note of notes) {
      if (note.hit || note.missed || note.lane !== lane) continue;
      const diff = Math.abs(note.time - t);
      if (diff <= hitWindow && diff < closest) { closest = diff; target = note; }
    }
    if (!target) return;

    target.hit = true;
    combo++;
    maxCombo = Math.max(maxCombo, combo);

    if (closest <= perfectWindow) { score += skillActive ? 1500 : 1000; perfect++; judge('PERFECT'); }
    else if (closest <= greatWindow) { score += skillActive ? 1050 : 700; great++; judge('GREAT'); }
    else { score += skillActive ? 600 : 400; okay++; judge('OKAY'); }

    removeNote(target, true);
    hud();
  }

  function stop(goBack=true) {
    running = false;
    cancelAnimationFrame(frame);
    if (audio) { audio.pause(); audio.currentTime = 0; }
    document.querySelectorAll('.note').forEach(n => n.remove());
    if (goBack) location.href = 'index.html?return=nowplay';
  }

  function showResult() {
    running = false;
    cancelAnimationFrame(frame);
    if (audio) { audio.pause(); audio.currentTime = 0; }
    document.querySelectorAll('.note').forEach(n => n.remove());

    $('resultTitle').textContent = song.name;
    $('resultScore').textContent = score.toLocaleString();
    $('resultPerfect').textContent = perfect;
    $('resultGreat').textContent = great;
    $('resultOkay').textContent = okay;
    $('resultMiss').textContent = miss;
    $('resultMaxCombo').textContent = maxCombo;

    const ratio = notes.length ? (perfect + great * .7 + okay * .4) / notes.length : 0;
    $('resultRank').textContent = ratio >= .90 ? 'S' : ratio >= .80 ? 'A' : ratio >= .65 ? 'B' : ratio >= .50 ? 'C' : 'D';
    $('result').classList.remove('hidden');
  }

  function activateSkill() {
    if (!running || !skillReady || skillActive || !audio) return;
    skillReady = false;
    skillActive = true;
    skillNextAt = audio.currentTime + 20;
    updateSkill(audio.currentTime);

    setTimeout(() => {
      skillActive = false;
      if (running && audio) updateSkill(audio.currentTime);
    }, 5000);
  }

  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (!(key in keys) || e.repeat) return;
    e.preventDefault();
    const button = document.querySelector(`[data-key="${key}"]`);
    if (button) button.classList.add('active');
    hit(keys[key]);
  });

  document.addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    const button = document.querySelector(`[data-key="${key}"]`);
    if (button) button.classList.remove('active');
  });

  // Touch anywhere inside the lane area: map the touch X position to one of 4 lanes.
  // This keeps the PC layout while making the actual playfield tappable on phones.
  laneArea.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    const rect = laneArea.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left));
    const lane = Math.floor(x / (rect.width / 4));
    hit(lane);
    const button = document.querySelector(`.keys button[data-lane="${lane}"]`);
    if (button) {
      button.classList.add('active');
      setTimeout(() => button.classList.remove('active'), 90);
    }
  }, { passive: false });

  document.querySelectorAll('.keys button').forEach(button => {
    const press = (e) => {
      e.preventDefault();
      button.classList.add('active');
      hit(Number(button.dataset.lane));
    };
    const release = () => button.classList.remove('active');
    button.addEventListener('pointerdown', press, { passive:false });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  });

  $('backBtn').addEventListener('click', () => stop(true));
  $('skillBtn').addEventListener('click', activateSkill);
  $('resultBackBtn').addEventListener('click', () => { location.href = 'index.html?return=nowplay'; });

  function start() {
    if (!audio) {
      judge('NO AUDIO');
      return;
    }
    running = true;
    score = 0; combo = 0; maxCombo = 0; perfect = 0; great = 0; okay = 0; miss = 0;
    skillReady = true; skillActive = false; skillNextAt = 0;
    $('result').classList.add('hidden');
    hud();
    updateSkill(0);
    $('ready').classList.add('show');
    audio.currentTime = 0;
    audio.play().catch(() => judge('PRESS PLAY / ALLOW AUDIO'));
    frame = requestAnimationFrame(loop);
  }

  if (audio) audio.addEventListener('ended', showResult);
  start();
})();

import { preload } from '@ucd-lib/cork-icon';

export default preload([
  {
    name: 'fontawesome-7.0-solid', 
    aliases: ['fas'], 
    preload: [
      'plug-circle-exclamation', 'xmark', 'trash',
      'spinner', 'circle-exclamation', 'upload', 'circle-info', 'plus',
      'check', 'circle-chevron-right', 'ellipsis', 'arrow-up', 'arrow-down'
    ]
  }, 
  { 
    name: 'ucdlib-core', 
    preload: ['ucdlib-logo']
  } 
]);
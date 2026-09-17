// Importing from the '@douyinfe/semi-ui' barrel pulls in every component's stylesheet
// (661 kB) because the package lists that barrel in its `sideEffects`, so it can never be
// tree-shaken. Components are imported from their own paths instead; the shared token
// layer the barrel used to provide has to be loaded here, once per chunk rendering Semi.
import '@douyinfe/semi-ui/react19-adapter'
import '@douyinfe/semi-ui/lib/es/_base/base.css'

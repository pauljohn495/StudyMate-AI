import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true};}
  componentDidCatch(error:Error,info:ErrorInfo){if(import.meta.env.DEV)console.error('StudyMate render error',error,info);}
  render(){if(this.state.failed)return <main className="grid min-h-screen place-items-center bg-canvas px-5 text-center dark:bg-slate-950"><div className="max-w-md"><p className="eyebrow">Something went wrong</p><h1 className="mt-2 font-display text-3xl font-extrabold">StudyMate hit an unexpected error</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your saved study data is still safe. Reload the app to continue.</p><button type="button" onClick={()=>window.location.assign('/app')} className="btn-primary mt-6">Reload workspace</button></div></main>;return this.props.children;}
}

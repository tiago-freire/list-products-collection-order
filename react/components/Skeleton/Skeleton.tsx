import type { CSSProperties } from 'react'
import React from 'react'

import styles from './styles.css'

const Skeleton = (props: CSSProperties) => {
  return <div style={{ ...props }} className={styles.skeleton} />
}

export default Skeleton

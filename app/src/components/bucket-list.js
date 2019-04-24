import React from 'react'
import { connect } from 'redux-bundler-react'


function BucketList (props) {
  let buckets = ['ci-kubernetes-e2e-gci-gce/1116453304528801792',
                 'ci-kubernetes-e2e-gce-cos-k8sstable3-default/1116369525902675974',
                 'ci-kubernetes-e2e-gce-cos-k8sstable2-default/1116461866978119689',
                 'ci-kubernetes-e2e-gce-cos-k8sstable1-default/1116466143159128064',
                 'ci-kubernetes-e2e-gce-cos-k8sbeta-default/1116430159767932928',
                 'ci-kubernetes-e2e-gci-gce/1120531338168897538'
                ]

  const { doUpdateQuery,
          doMarkEndpointsResourceAsOutdated,
          doMarkTestsResourceAsOutdated,
          doMarkTestSequencesResourceAsOutdated,
          doMarkTestTagsResourceAsOutdated,
          doMarkUseragentsResourceAsOutdated,
        } = props
  return (
      <div className='min-vh-80'>
      <h1>Select A Bucket</h1>
      <ul>
      {buckets.map((bucket, i) => <li key={`bucket_${i}`}><a href='#' onClick={handleClick}>{bucket}</a></li>)}
    </ul>
      </div>
  )

  function handleClick (e) {
    let storagePath = 'apisnoop/spyglass/'
    let bucket = e.target.innerHTML
    let fullPath = storagePath.concat(bucket)
    doMarkEndpointsResourceAsOutdated()
    doMarkTestsResourceAsOutdated()
    doMarkTestSequencesResourceAsOutdated()
    doMarkTestTagsResourceAsOutdated()
    doMarkUseragentsResourceAsOutdated()
    doUpdateQuery({bucket: fullPath})
  }
}

export default connect(
  'doUpdateQuery',
  'doMarkEndpointsResourceAsOutdated',
  'doMarkTestsResourceAsOutdated',
  'doMarkTestSequencesResourceAsOutdated',
  'doMarkTestTagsResourceAsOutdated',
  'doMarkUseragentsResourceAsOutdated',
  BucketList
)

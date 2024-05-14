pipeline {
  agent any
  stages {
    stage('Source') {
      steps {
        git 'https://github.com/explore-jenkins'
      }
    }

  }
  environment {
    REMOTE_AWS_MYSQL_USER = credentials('pmm-dev-mysql-remote-user')
    REMOTE_AWS_MYSQL_PASSWORD = credentials('pmm-dev-remote-password')
    REMOTE_AWS_MYSQL57_HOST = credentials('pmm-dev-mysql57-remote-host')
    REMOTE_MYSQL_HOST = credentials('mysql-remote-host')
    REMOTE_MYSQL_USER = credentials('mysql-remote-user')
    REMOTE_MYSQL_PASSWORD = credentials('mysql-remote-password')
    REMOTE_MONGODB_HOST = credentials('qa-remote-mongodb-host')
    REMOTE_MONGODB_USER = credentials('qa-remote-mongodb-user')
    REMOTE_MONGODB_PASSWORD = credentials('qa-remote-mongodb-password')
    REMOTE_POSTGRESQL_HOST = credentials('qa-remote-pgsql-host')
    REMOTE_POSTGRESQL_USER = credentials('qa-remote-pgsql-user')
    REMOTE_POSTGRESSQL_PASSWORD = credentials('qa-remote-pgsql-password')
    REMOTE_PROXYSQL_HOST = credentials('qa-remote-proxysql-host')
    REMOTE_PROXYSQL_USER = credentials('qa-remote-proxysql-user')
    REMOTE_PROXYSQL_PASSWORD = credentials('qa-remote-proxysql-password')
    INFLUXDB_ADMIN_USER = credentials('influxdb-admin-user')
    INFLUXDB_ADMIN_PASSWORD = credentials('influxdb-admin-password')
    INFLUXDB_USER = credentials('influxdb-user')
    INFLUXDB_USER_PASSWORD = credentials('influxdb-user-password')
    MONITORING_HOST = credentials('monitoring-host')
    COMPLETED_MSG = 'build done!'
  }
  post {
    always {
      sh '''
               sg docker -c "make docker_clean"
               sudo chmod 777 -R pmm-app/
            '''
      script {
        if (currentBuild.result == null || currentBuild.result == 'SUCCESS') {
          junit 'pmm-app/tests/output/parallel_chunk*/*.xml'
          slackSend channel: '#pmm-ci', color: '#00FF00', message: "[${JOB_NAME}]: build finished"
        } else {
          archiveArtifacts artifacts: 'pmm-app/tests/output/parallel_chunk*/*.png'
          junit 'pmm-app/tests/output/parallel_chunk*/*.xml'
          slackSend channel: '#pmm-ci', color: '#FF0000', message: "[${JOB_NAME}]: build ${currentBuild.result}"
        }
      }

      deleteDir()
    }

  }
  parameters {
    choice(choices: [ 'test', 'e2e' ], description: 'Select test to run', name: 'RUN_TEST')
    choice(choices: [ '80.0' ], description: 'Google Chrome version', name: 'CHROME_VERSION')
    choice(choices: [ '12.14' ], description: 'Node.js version', name: 'NODEJS_VERSION')
  }
}